import { Pool, PoolClient } from 'pg';

// 数据库连接池配置
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
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
 * 关闭数据库连接池
 * 主要用于测试或应用关闭时清理资源
 */
export async function closePool(): Promise<void> {
  if (globalPool) {
    await globalPool.end();
    globalPool = undefined;
  }
}

// 数据库表结构类型定义
export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
}

export interface ActivationCode {
  id: number;
  code: string;
  status: 'unused' | 'used';
  expires_at: Date | null;
  used_at: Date | null;
  used_by_device_id: string | null;
  created_at: Date;
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
 * 创建激活码
 * @param codes 激活码数组
 * @returns 创建的激活码记录
 */
export async function createActivationCodes(
  codes: Array<{ code: string; expires_at?: Date | null }>
): Promise<ActivationCode[]> {
  const values = codes.map((_, index) => 
    `($${index * 2 + 1}, $${index * 2 + 2})`
  ).join(', ');
  
  const params = codes.flatMap(item => [item.code, item.expires_at]);
  
  const result = await query(
    `INSERT INTO activation_codes (code, expires_at) 
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
    // 查询激活码
    const result = await client.query(
      'SELECT * FROM activation_codes WHERE code = $1',
      [code]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: '激活码不存在' };
    }
    
    const activationCode = result.rows[0] as ActivationCode;
    
    // 检查状态
    if (activationCode.status === 'used') {
      return { success: false, message: '激活码已被使用' };
    }
    
    // 检查过期时间
    if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
      return { success: false, message: '激活码已过期' };
    }
    
    // 更新激活码状态
    await client.query(
      `UPDATE activation_codes 
       SET status = 'used', used_by_device_id = $1, used_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [deviceId, activationCode.id]
    );
    
    return { 
      success: true, 
      message: '激活成功',
      activationCode: { ...activationCode, status: 'used' as const, used_by_device_id: deviceId }
    };
  });
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
