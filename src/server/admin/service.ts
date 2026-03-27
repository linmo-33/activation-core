import {
  type AdminLoginGuardStatus as RepositoryAdminLoginGuardStatus,
  type AdminUserRecord,
  type AdminLoginGuardConfig,
  type AdminLoginGuardType,
  createInitialAdminUser,
  findAdminByUsername,
  findAdminPasswordById,
  findLoginGuardsByKeys,
  hasAnyAdminUser,
  recordLoginFailures,
  removeLoginGuardsByKeys,
  updateAdminPasswordById,
} from "@/db/repositories";

export type AdminUser = AdminUserRecord;
export type AdminLoginGuardStatus = RepositoryAdminLoginGuardStatus;

const ADMIN_LOGIN_GUARD_CONFIGS: Record<AdminLoginGuardType, AdminLoginGuardConfig> = {
  username: {
    maxFailures: 5,
    windowMinutes: 15,
    lockMinutes: 30,
  },
  ip: {
    maxFailures: 10,
    windowMinutes: 15,
    lockMinutes: 15,
  },
};

function getRetryAfterSeconds(lockedUntil: Date | null, now: Date): number {
  if (!lockedUntil) {
    return 0;
  }

  return Math.max(0, Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000));
}

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  return await findAdminByUsername(username);
}

export async function isAdminSystemInitialized(): Promise<boolean> {
  return await hasAnyAdminUser();
}

export async function createInitialAdmin(
  username: string,
  passwordHash: string
): Promise<AdminUser> {
  return await createInitialAdminUser(username, passwordHash);
}

export async function getAdminById(id: number): Promise<AdminUser | null> {
  const admin = await findAdminPasswordById(id);
  if (!admin) {
    return null;
  }

  return {
    id: admin.id,
    username: admin.username,
    password_hash: admin.password_hash,
  };
}

export async function updateAdminPassword(
  id: number,
  passwordHash: string
): Promise<boolean> {
  return await updateAdminPasswordById(id, passwordHash);
}

export async function getAdminLoginGuardStatus(
  username: string,
  ipAddress: string
): Promise<AdminLoginGuardStatus> {
  const result = await findLoginGuardsByKeys([`username:${username}`, `ip:${ipAddress}`]);

  const now = new Date();
  let blocked = false;
  let retryAfterSeconds = 0;

  for (const record of result) {
    if (record.locked_until && record.locked_until > now) {
      blocked = true;
      retryAfterSeconds = Math.max(retryAfterSeconds, getRetryAfterSeconds(record.locked_until, now));
    }
  }

  return {
    blocked,
    retryAfterSeconds,
  };
}

export async function recordAdminLoginFailure(
  username: string,
  ipAddress: string
): Promise<AdminLoginGuardStatus> {
  return await recordLoginFailures(
    username,
    ipAddress,
    ADMIN_LOGIN_GUARD_CONFIGS
  );
}

export async function clearAdminLoginFailures(
  username: string,
  ipAddress: string
): Promise<void> {
  await removeLoginGuardsByKeys([`username:${username}`, `ip:${ipAddress}`]);
}
