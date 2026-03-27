import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { adminLoginGuards } from "@/db/schema";
import { DbTransaction } from "./_shared";

export type AdminLoginGuardType = "username" | "ip";

export interface AdminLoginGuardRecord {
  guard_key: string;
  guard_type: AdminLoginGuardType;
  failed_count: number;
  first_failed_at: Date;
  last_failed_at: Date;
  locked_until: Date | null;
}

export interface AdminLoginGuardConfig {
  maxFailures: number;
  windowMinutes: number;
  lockMinutes: number;
}

export interface AdminLoginGuardStatus {
  blocked: boolean;
  retryAfterSeconds: number;
}

interface LockedLoginGuardRow {
  guard_key: string;
  guard_type: AdminLoginGuardType;
  failed_count: number | string;
  first_failed_at: Date | string;
  last_failed_at: Date | string;
  locked_until: Date | string | null;
}

function mapLoginGuardRow(row: typeof adminLoginGuards.$inferSelect): AdminLoginGuardRecord {
  return {
    guard_key: row.guardKey,
    guard_type: row.guardType as AdminLoginGuardType,
    failed_count: row.failedCount,
    first_failed_at: row.firstFailedAt,
    last_failed_at: row.lastFailedAt,
    locked_until: row.lockedUntil,
  };
}

function mapLockedLoginGuardRow(row: LockedLoginGuardRow): AdminLoginGuardRecord {
  return {
    guard_key: row.guard_key,
    guard_type: row.guard_type,
    failed_count: Number(row.failed_count),
    first_failed_at: row.first_failed_at instanceof Date ? row.first_failed_at : new Date(String(row.first_failed_at)),
    last_failed_at: row.last_failed_at instanceof Date ? row.last_failed_at : new Date(String(row.last_failed_at)),
    locked_until: row.locked_until instanceof Date ? row.locked_until : row.locked_until ? new Date(String(row.locked_until)) : null,
  };
}

export async function findLoginGuardsByKeys(guardKeys: string[]): Promise<AdminLoginGuardRecord[]> {
  const rows = await db
    .select()
    .from(adminLoginGuards)
    .where(inArray(adminLoginGuards.guardKey, guardKeys));

  return rows.map(mapLoginGuardRow);
}

export async function removeLoginGuardsByKeys(guardKeys: string[]): Promise<void> {
  await db
    .delete(adminLoginGuards)
    .where(inArray(adminLoginGuards.guardKey, guardKeys));
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getRetryAfterSeconds(lockedUntil: Date | null, now: Date): number {
  if (!lockedUntil) {
    return 0;
  }

  return Math.max(0, Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000));
}

async function upsertLoginGuardFailure(
  tx: DbTransaction,
  guardType: AdminLoginGuardType,
  identifier: string,
  config: AdminLoginGuardConfig
): Promise<AdminLoginGuardStatus> {
  const guardKey = `${guardType}:${identifier}`;
  const now = new Date();

  const existingRows = await tx.execute(sql`
    SELECT guard_key, guard_type, failed_count, first_failed_at, last_failed_at, locked_until
    FROM admin_login_guards
    WHERE guard_key = ${guardKey}
    FOR UPDATE
  `);

  let failedCount = 1;
  let firstFailedAt = now;
  let lockedUntil: Date | null = null;

  if (existingRows.rows.length > 0) {
    const existingRecord = mapLockedLoginGuardRow(existingRows.rows[0] as unknown as LockedLoginGuardRow);
    const windowExpired = addMinutes(existingRecord.first_failed_at, config.windowMinutes) <= now;
    const activeLock = existingRecord.locked_until && existingRecord.locked_until > now;

    failedCount = windowExpired ? 1 : existingRecord.failed_count + 1;
    firstFailedAt = windowExpired ? now : existingRecord.first_failed_at;
    lockedUntil = activeLock ? existingRecord.locked_until : null;

    if (failedCount >= config.maxFailures) {
      lockedUntil = addMinutes(now, config.lockMinutes);
    }

    await tx
      .update(adminLoginGuards)
      .set({
        failedCount,
        firstFailedAt,
        lastFailedAt: now,
        lockedUntil,
      })
      .where(eq(adminLoginGuards.guardKey, guardKey));
  } else {
    if (failedCount >= config.maxFailures) {
      lockedUntil = addMinutes(now, config.lockMinutes);
    }

    await tx.insert(adminLoginGuards).values({
      guardKey,
      guardType,
      failedCount,
      firstFailedAt,
      lastFailedAt: now,
      lockedUntil,
    });
  }

  return {
    blocked: lockedUntil !== null && lockedUntil > now,
    retryAfterSeconds: getRetryAfterSeconds(lockedUntil, now),
  };
}

export async function recordLoginFailures(
  username: string,
  ipAddress: string,
  configs: Record<AdminLoginGuardType, AdminLoginGuardConfig>
): Promise<AdminLoginGuardStatus> {
  return await db.transaction(async (tx) => {
    const usernameStatus = await upsertLoginGuardFailure(tx, "username", username, configs.username);
    const ipStatus = await upsertLoginGuardFailure(tx, "ip", ipAddress, configs.ip);

    return {
      blocked: usernameStatus.blocked || ipStatus.blocked,
      retryAfterSeconds: Math.max(usernameStatus.retryAfterSeconds, ipStatus.retryAfterSeconds),
    };
  });
}
