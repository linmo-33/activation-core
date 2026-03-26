import { Pool, PoolClient } from 'pg';

// 数据库连接池配置 
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 5,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
};

// 全局连接池实例
let globalPool: Pool | undefined;

/**
 * 获取数据库连接池
 * 在 Serverless 环境中复用连接池实例
 */
function getPool(): Pool {
  if (!globalPool) {
    globalPool = new Pool(dbConfig);

    // 监听连接池事件
    globalPool.on('error', (err) => {
      console.error('数据库连接池错误:', err);
    });

    globalPool.on('connect', () => {
      console.log('数据库连接成功');
    });
  }

  return globalPool;
}

/**
 * 执行数据库查询
 * @param text SQL 查询语句
 * @param params 查询参数
 * @returns 查询结果
 */
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    console.log('执行查询:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;

    // 安全日志：在生产环境中不记录敏感的查询信息
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.error('数据库查询错误:', {
        duration,
        errorCode: error.code,
        errorMessage: error.message
      });
    } else {
      console.error('数据库查询错误:', {
        text,
        params,
        duration,
        error: {
          message: error.message,
          code: error.code,
          detail: error.detail,
          hint: error.hint
        }
      });
    }

    // 根据错误类型提供更友好的错误信息
    if (error.code === '23505') {
      throw new Error('数据已存在，请检查是否重复');
    } else if (error.code === '23503') {
      throw new Error('数据引用错误，请检查关联数据');
    } else if (error.code === '42P01') {
      throw new Error('数据表不存在，请检查数据库配置');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('数据库连接失败，请检查网络连接');
    } else if (error.code === '28P01') {
      throw new Error('数据库认证失败，请检查用户名和密码');
    }

    throw error;
  }
}

/**
 * 获取数据库连接客户端（用于事务）
 * @returns 数据库客户端
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * 执行事务
 * @param callback 事务回调函数
 * @returns 事务结果
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 获取连接池状态信息
 * 用于监控和调试
 */
export function getPoolStatus() {
  if (!globalPool) {
    return {
      status: 'not_initialized',
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    };
  }

  return {
    status: 'active',
    totalCount: globalPool.totalCount,
    idleCount: globalPool.idleCount,
    waitingCount: globalPool.waitingCount,
    maxConnections: dbConfig.max
  };
}

/**
 * 关闭数据库连接池
 * 主要用于测试或应用关闭时清理资源
 */
export async function closePool(): Promise<void> {
  if (globalPool) {
    console.log('🔄 正在关闭数据库连接池...', getPoolStatus());
    await globalPool.end();
    globalPool = undefined;
    console.log('✅ 数据库连接池已关闭');
  }
}

// 数据库表结构类型定义
export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
}

type AdminLoginGuardType = 'username' | 'ip';

interface AdminLoginGuardRecord {
  guard_key: string;
  guard_type: AdminLoginGuardType;
  failed_count: number;
  first_failed_at: Date;
  last_failed_at: Date;
  locked_until: Date | null;
}

interface AdminLoginGuardConfig {
  maxFailures: number;
  windowMinutes: number;
  lockMinutes: number;
}

export interface AdminLoginGuardStatus {
  blocked: boolean;
  retryAfterSeconds: number;
}

export interface ActivationCode {
  id: number;
  code: string;
  status: 'unused' | 'used';
  expires_at: Date | null;
  used_at: Date | null;
  used_by_device_id: string | null;
  created_at: Date;
  validity_days: number | null; // 激活后的有效天数：NULL=使用expires_at，1=日卡，30=月卡
}

const ADMIN_LOGIN_GUARD_CONFIGS: Record<AdminLoginGuardType, AdminLoginGuardConfig> = {
  username: {
    maxFailures: 5,
    windowMinutes: 15,
    lockMinutes: 30
  },
  ip: {
    maxFailures: 10,
    windowMinutes: 15,
    lockMinutes: 15
  }
};

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getRetryAfterSeconds(lockedUntil: Date | null, now: Date): number {
  if (!lockedUntil) {
    return 0;
  }

  return Math.max(0, Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000));
}

function normalizeLoginGuardRecord(
  row: Record<string, unknown>
): AdminLoginGuardRecord {
  return {
    guard_key: String(row.guard_key),
    guard_type: row.guard_type as AdminLoginGuardType,
    failed_count: Number(row.failed_count),
    first_failed_at: new Date(String(row.first_failed_at)),
    last_failed_at: new Date(String(row.last_failed_at)),
    locked_until: row.locked_until ? new Date(String(row.locked_until)) : null
  };
}

// 数据库操作函数

/**
 * 验证管理员登录
 * @param username 用户名
 * @returns 管理员信息或 null（仅用于获取用户信息）
 */
export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  const result = await query(
    'SELECT id, username, password_hash FROM admin_users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as AdminUser;
}

/**
 * 检查管理员系统是否已初始化
 * @returns 是否已存在管理员账号
 */
export async function isAdminSystemInitialized(): Promise<boolean> {
  const result = await query(
    'SELECT EXISTS (SELECT 1 FROM admin_users) AS initialized'
  );

  return result.rows[0]?.initialized === true;
}

/**
 * 创建首个管理员账号
 * 仅允许在系统未初始化时调用
 * @param username 管理员用户名
 * @param passwordHash 密码哈希
 * @returns 创建后的管理员信息
 */
export async function createInitialAdmin(
  username: string,
  passwordHash: string
): Promise<AdminUser> {
  return transaction(async (client) => {
    // 锁表确保并发初始化时只会成功创建一个管理员
    await client.query('LOCK TABLE admin_users IN ACCESS EXCLUSIVE MODE');

    const existingAdminResult = await client.query(
      'SELECT id FROM admin_users LIMIT 1'
    );

    if (existingAdminResult.rows.length > 0) {
      throw new Error('ADMIN_ALREADY_INITIALIZED');
    }

    const insertResult = await client.query(
      `INSERT INTO admin_users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, password_hash`,
      [username, passwordHash]
    );

    return insertResult.rows[0] as AdminUser;
  });
}

/**
 * 获取管理员登录保护状态
 * 当用户名或 IP 任一被锁定时，禁止继续登录
 */
export async function getAdminLoginGuardStatus(
  username: string,
  ipAddress: string
): Promise<AdminLoginGuardStatus> {
  const result = await query(
    `SELECT guard_key, guard_type, failed_count, first_failed_at, last_failed_at, locked_until
     FROM admin_login_guards
     WHERE guard_key = ANY($1::text[])`,
    [[`username:${username}`, `ip:${ipAddress}`]]
  );

  const now = new Date();
  let blocked = false;
  let retryAfterSeconds = 0;

  for (const row of result.rows) {
    const record = normalizeLoginGuardRecord(row);
    if (record.locked_until && record.locked_until > now) {
      blocked = true;
      retryAfterSeconds = Math.max(retryAfterSeconds, getRetryAfterSeconds(record.locked_until, now));
    }
  }

  return {
    blocked,
    retryAfterSeconds
  };
}

async function upsertAdminLoginGuardFailure(
  client: PoolClient,
  guardType: AdminLoginGuardType,
  identifier: string
): Promise<AdminLoginGuardStatus> {
  const config = ADMIN_LOGIN_GUARD_CONFIGS[guardType];
  const guardKey = `${guardType}:${identifier}`;
  const now = new Date();

  const existingResult = await client.query(
    `SELECT guard_key, guard_type, failed_count, first_failed_at, last_failed_at, locked_until
     FROM admin_login_guards
     WHERE guard_key = $1
     FOR UPDATE`,
    [guardKey]
  );

  let failedCount = 1;
  let firstFailedAt = now;
  let lockedUntil: Date | null = null;

  if (existingResult.rows.length > 0) {
    const existingRecord = normalizeLoginGuardRecord(existingResult.rows[0]);
    const windowExpired = addMinutes(existingRecord.first_failed_at, config.windowMinutes) <= now;
    const activeLock = existingRecord.locked_until && existingRecord.locked_until > now;

    failedCount = windowExpired ? 1 : existingRecord.failed_count + 1;
    firstFailedAt = windowExpired ? now : existingRecord.first_failed_at;
    lockedUntil = activeLock ? existingRecord.locked_until : null;

    if (failedCount >= config.maxFailures) {
      lockedUntil = addMinutes(now, config.lockMinutes);
    }

    await client.query(
      `UPDATE admin_login_guards
       SET failed_count = $2,
           first_failed_at = $3,
           last_failed_at = $4,
           locked_until = $5
       WHERE guard_key = $1`,
      [guardKey, failedCount, firstFailedAt, now, lockedUntil]
    );
  } else {
    if (failedCount >= config.maxFailures) {
      lockedUntil = addMinutes(now, config.lockMinutes);
    }

    await client.query(
      `INSERT INTO admin_login_guards (
         guard_key,
         guard_type,
         failed_count,
         first_failed_at,
         last_failed_at,
         locked_until
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [guardKey, guardType, failedCount, firstFailedAt, now, lockedUntil]
    );
  }

  return {
    blocked: lockedUntil !== null && lockedUntil > now,
    retryAfterSeconds: getRetryAfterSeconds(lockedUntil, now)
  };
}

/**
 * 记录管理员登录失败
 * 同时按用户名和 IP 两个维度更新失败计数与锁定状态
 */
export async function recordAdminLoginFailure(
  username: string,
  ipAddress: string
): Promise<AdminLoginGuardStatus> {
  return transaction(async (client) => {
    const usernameStatus = await upsertAdminLoginGuardFailure(client, 'username', username);
    const ipStatus = await upsertAdminLoginGuardFailure(client, 'ip', ipAddress);

    return {
      blocked: usernameStatus.blocked || ipStatus.blocked,
      retryAfterSeconds: Math.max(usernameStatus.retryAfterSeconds, ipStatus.retryAfterSeconds)
    };
  });
}

/**
 * 清理管理员登录失败状态
 * 登录成功后重置用户名和 IP 两个维度的保护记录
 */
export async function clearAdminLoginFailures(
  username: string,
  ipAddress: string
): Promise<void> {
  await query(
    `DELETE FROM admin_login_guards
     WHERE guard_key = ANY($1::text[])`,
    [[`username:${username}`, `ip:${ipAddress}`]]
  );
}

/**
 * 创建激活码
 * @param codes 激活码数组
 * @returns 创建的激活码记录
 */
export async function createActivationCodes(
  codes: Array<{ code: string; expires_at?: Date | null; validity_days?: number | null }>
): Promise<ActivationCode[]> {
  const values = codes.map((_, index) =>
    `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
  ).join(', ');

  const params = codes.flatMap(item => [item.code, item.expires_at, item.validity_days ?? null]);

  const result = await query(
    `INSERT INTO activation_codes (code, expires_at, validity_days) 
     VALUES ${values} 
     RETURNING *`,
    params
  );

  return result.rows as ActivationCode[];
}

/**
 * 获取激活码列表
 * @param filters 筛选条件
 * @returns 激活码列表
 */
export async function getActivationCodes(filters?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ codes: ActivationCode[]; total: number }> {
  let whereClause = '';
  let params: any[] = [];
  let paramIndex = 1;

  if (filters?.status && filters.status !== 'all') {
    whereClause += ` WHERE status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters?.search) {
    const searchClause = whereClause ? ' AND ' : ' WHERE ';
    whereClause += `${searchClause}(code ILIKE $${paramIndex} OR used_by_device_id ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) FROM activation_codes${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // 获取数据
  let limitClause = '';
  if (filters?.limit) {
    limitClause += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;

    if (filters?.offset) {
      limitClause += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }
  }

  const result = await query(
    `SELECT * FROM activation_codes${whereClause} ORDER BY created_at DESC${limitClause}`,
    params
  );

  return {
    codes: result.rows as ActivationCode[],
    total
  };
}

/**
 * 验证激活码
 * @param code 激活码
 * @param deviceId 设备ID
 * @returns 验证结果
 */
export async function validateActivationCode(
  code: string,
  deviceId: string
): Promise<{ success: boolean; message: string; activationCode?: ActivationCode }> {
  return await transaction(async (client) => {
    // 1. 检查设备是否已经激活过其他有效激活码（设备唯一性检查）
    // 只检查未过期的激活码，允许过期后重新激活
    const deviceCheckResult = await client.query(
      `SELECT code, used_at, expires_at
       FROM activation_codes
       WHERE used_by_device_id = $1
         AND status = $2
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
      [deviceId, 'used']
    );

    if (deviceCheckResult.rows.length > 0) {
      const existingCode = deviceCheckResult.rows[0];
      const expiresInfo = existingCode.expires_at
        ? `，有效期至 ${new Date(existingCode.expires_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
        : '，永久有效';
      console.log(`🚫 设备重复激活检测: ${deviceId} 已使用有效激活码 ${existingCode.code}${expiresInfo}`);
      return {
        success: false,
        message: `该设备已有有效的激活码，每个设备只能同时使用一个激活码`
      };
    }

    // 2. 查询目标激活码（使用 FOR UPDATE 锁定记录防止并发问题）
    const result = await client.query(
      'SELECT * FROM activation_codes WHERE code = $1 FOR UPDATE',
      [code]
    );

    if (result.rows.length === 0) {
      console.log(`🚫 激活码不存在: ${code}`);
      return { success: false, message: '激活码不存在' };
    }

    const activationCode = result.rows[0] as ActivationCode;

    // 3. 检查激活码状态
    if (activationCode.status === 'used') {
      const usedInfo = activationCode.used_by_device_id
        ? ` (设备: ${activationCode.used_by_device_id.substring(0, 8)}...)`
        : '';
      console.log(`🚫 激活码已被使用: ${code}${usedInfo}`);
      return { success: false, message: '激活码已被使用' };
    }

    // 4. 检查过期时间（仅对绝对过期时间的激活码）
    if (activationCode.validity_days === null && activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
      const expiredAt = new Date(activationCode.expires_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      console.log(`🚫 激活码已过期: ${code}，过期时间: ${expiredAt}`);
      return { success: false, message: '激活码已过期' };
    }

    // 5. 计算过期时间（对于相对过期时间的激活码）
    let calculatedExpiresAt = activationCode.expires_at;
    if (activationCode.validity_days !== null) {
      const now = new Date();
      calculatedExpiresAt = new Date(now.getTime() + activationCode.validity_days * 24 * 60 * 60 * 1000);
    }

    // 6. 更新激活码状态
    await client.query(
      `UPDATE activation_codes
       SET status = 'used', used_by_device_id = $1, used_at = CURRENT_TIMESTAMP, expires_at = $2
       WHERE id = $3`,
      [deviceId, calculatedExpiresAt, activationCode.id]
    );

    console.log(`✅ 设备激活成功: ${deviceId} 使用激活码 ${code}${activationCode.validity_days ? ` (${activationCode.validity_days}天有效期)` : ''}`);

    return {
      success: true,
      message: '激活成功',
      activationCode: {
        ...activationCode,
        status: 'used' as const,
        used_by_device_id: deviceId,
        expires_at: calculatedExpiresAt
      }
    };
  });
}

/**
 * 查询设备激活历史
 * @param deviceId 设备ID
 * @returns 设备激活历史
 */
export async function getDeviceActivationHistory(deviceId: string): Promise<ActivationCode[]> {
  const result = await query(
    `SELECT * FROM activation_codes
     WHERE used_by_device_id = $1
     ORDER BY used_at DESC`,
    [deviceId]
  );

  return result.rows as ActivationCode[];
}

/**
 * 检查设备是否已激活（只考虑有效期内的激活码）
 * @param deviceId 设备ID
 * @returns 设备激活状态和激活码信息
 */
export async function checkDeviceActivationStatus(deviceId: string): Promise<{
  isActivated: boolean;
  activationCode?: ActivationCode;
  hasExpiredActivations?: boolean;
}> {
  // 查询有效的激活码
  const validResult = await query(
    `SELECT * FROM activation_codes
     WHERE used_by_device_id = $1
       AND status = 'used'
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
     ORDER BY used_at DESC
     LIMIT 1`,
    [deviceId]
  );

  // 查询是否有过期的激活码
  const expiredResult = await query(
    `SELECT COUNT(*) as count FROM activation_codes
     WHERE used_by_device_id = $1
       AND status = 'used'
       AND expires_at IS NOT NULL
       AND expires_at <= CURRENT_TIMESTAMP`,
    [deviceId]
  );

  const hasExpiredActivations = parseInt(expiredResult.rows[0]?.count || '0') > 0;

  if (validResult.rows.length === 0) {
    return {
      isActivated: false,
      hasExpiredActivations
    };
  }

  return {
    isActivated: true,
    activationCode: validResult.rows[0] as ActivationCode,
    hasExpiredActivations
  };
}

/**
 * 重置激活码
 * @param codeId 激活码ID
 * @returns 重置结果
 */
export async function resetActivationCode(codeId: number): Promise<boolean> {
  const result = await query(
    `UPDATE activation_codes
     SET status = 'unused', used_by_device_id = NULL, used_at = NULL
     WHERE id = $1`,
    [codeId]
  );

  return (result.rowCount || 0) > 0;
}

export default { query, getClient, transaction, closePool };
