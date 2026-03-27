import { and, desc, eq, ilike, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { activationCodes } from "@/db/schema";
import { CURRENT_TIMESTAMP_SQL, DbTransaction, toNumber } from "./_shared";

export interface ActivationCodeRecord {
  id: number;
  code: string;
  status: "unused" | "used";
  expires_at: Date | null;
  used_at: Date | null;
  used_by_device_id: string | null;
  created_at: Date;
  validity_days: number | null;
}

interface ActivationCodeListFilters {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActivationValidationResult {
  success: boolean;
  message: string;
  activationCode?: ActivationCodeRecord;
}

export interface ActivationCleanupStatsRecord {
  cleanableExpired: number;
  totalExpired: number;
  totalCodes: number;
  unusedCodes: number;
  usedCodes: number;
}

export interface ActivationOverviewStatsRecord {
  totalCodes: number;
  unusedCodes: number;
  usedCodes: number;
  expiredCodes: number;
}

export interface ActivationDetailedStatsRecord {
  overview: {
    totalCodes: number;
    unusedCodes: number;
    usedCodes: number;
    expiredCodes: number;
  };
  devices: {
    uniqueDevices: number;
    totalActivations: number;
    averageActivationsPerDevice: number;
  };
  expiry: {
    neverExpire: number;
    valid: number;
    expired: number;
  };
  recentCreated: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  activationTrend: Array<{
    date: string;
    activations: number;
  }>;
  hourlyActivations: Array<{
    hour: number;
    activations: number;
  }>;
}

interface LockedActivationCodeRow {
  id: number | string;
  code: string;
  status: "unused" | "used";
  expires_at: Date | string | null;
  used_at: Date | string | null;
  used_by_device_id: string | null;
  created_at: Date | string;
  validity_days: number | string | null;
}

function mapActivationCodeRow(row: typeof activationCodes.$inferSelect): ActivationCodeRecord {
  return {
    id: row.id,
    code: row.code,
    status: row.status as "unused" | "used",
    expires_at: row.expiresAt,
    used_at: row.usedAt,
    used_by_device_id: row.usedByDeviceId,
    created_at: row.createdAt,
    validity_days: row.validityDays,
  };
}

function mapLockedActivationCodeRow(row: LockedActivationCodeRow): ActivationCodeRecord {
  return {
    id: Number(row.id),
    code: String(row.code),
    status: row.status,
    expires_at: row.expires_at instanceof Date ? row.expires_at : row.expires_at ? new Date(String(row.expires_at)) : null,
    used_at: row.used_at instanceof Date ? row.used_at : row.used_at ? new Date(String(row.used_at)) : null,
    used_by_device_id: row.used_by_device_id ? String(row.used_by_device_id) : null,
    created_at: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
    validity_days: row.validity_days === null ? null : Number(row.validity_days),
  };
}

function activeActivationCondition() {
  return or(
    isNull(activationCodes.expiresAt),
    sql`${activationCodes.expiresAt} > CURRENT_TIMESTAMP`
  )!;
}

function expiredActivationCondition() {
  return and(
    isNotNull(activationCodes.expiresAt),
    sql`${activationCodes.expiresAt} <= CURRENT_TIMESTAMP`
  )!;
}

async function lockActivationCodeByCode(
  tx: DbTransaction,
  code: string
): Promise<ActivationCodeRecord | null> {
  const result = await tx.execute(sql`
    SELECT id, code, status, expires_at, used_at, used_by_device_id, created_at, validity_days
    FROM activation_codes
    WHERE code = ${code}
    FOR UPDATE
  `);

  if (result.rows.length === 0) {
    return null;
  }

  return mapLockedActivationCodeRow(result.rows[0] as unknown as LockedActivationCodeRow);
}

export async function listActivationCodes(
  filters?: ActivationCodeListFilters
): Promise<{ codes: ActivationCodeRecord[]; total: number }> {
  const conditions = [];

  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(activationCodes.status, filters.status));
  }

  if (filters?.search) {
    conditions.push(
      or(
        ilike(activationCodes.code, `%${filters.search}%`),
        ilike(activationCodes.usedByDeviceId, `%${filters.search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(activationCodes)
    .where(whereClause);

  let dataQuery = db
    .select()
    .from(activationCodes)
    .where(whereClause)
    .orderBy(desc(activationCodes.createdAt))
    .$dynamic();

  if (typeof filters?.limit === "number") {
    dataQuery = dataQuery.limit(filters.limit);
  }

  if (typeof filters?.offset === "number" && filters.offset > 0) {
    dataQuery = dataQuery.offset(filters.offset);
  }

  const rows = await dataQuery;

  return {
    codes: rows.map(mapActivationCodeRow),
    total: toNumber(totalResult[0]?.count),
  };
}

export async function listDeviceActivationHistory(deviceId: string): Promise<ActivationCodeRecord[]> {
  const rows = await db
    .select()
    .from(activationCodes)
    .where(eq(activationCodes.usedByDeviceId, deviceId))
    .orderBy(desc(activationCodes.usedAt));

  return rows.map(mapActivationCodeRow);
}

export async function findValidActivationByDevice(deviceId: string): Promise<ActivationCodeRecord | null> {
  const rows = await db
    .select()
    .from(activationCodes)
    .where(
      and(
        eq(activationCodes.usedByDeviceId, deviceId),
        eq(activationCodes.status, "used"),
        activeActivationCondition()
      )
    )
    .orderBy(desc(activationCodes.usedAt))
    .limit(1);

  return rows[0] ? mapActivationCodeRow(rows[0]) : null;
}

export async function countExpiredActivationsByDevice(deviceId: string): Promise<number> {
  const result = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(activationCodes)
    .where(
      and(
        eq(activationCodes.usedByDeviceId, deviceId),
        eq(activationCodes.status, "used"),
        expiredActivationCondition()
      )
    );

  return toNumber(result[0]?.count);
}

export async function deleteActivationCodesByIds(ids: number[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  const deletedRows = await db
    .delete(activationCodes)
    .where(inArray(activationCodes.id, ids))
    .returning({ id: activationCodes.id });

  return deletedRows.length;
}

export async function resetActivationCodesByIds(ids: number[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  const updatedRows = await db
    .update(activationCodes)
    .set({
      status: "unused",
      usedByDeviceId: null,
      usedAt: null,
      updatedAt: CURRENT_TIMESTAMP_SQL,
    })
    .where(and(inArray(activationCodes.id, ids), eq(activationCodes.status, "used")))
    .returning({ id: activationCodes.id });

  return updatedRows.length;
}

export async function resetValidActivationCodesByDevice(deviceId: string): Promise<number> {
  const updatedRows = await db
    .update(activationCodes)
    .set({
      status: "unused",
      usedByDeviceId: null,
      usedAt: null,
      updatedAt: CURRENT_TIMESTAMP_SQL,
    })
    .where(
      and(
        eq(activationCodes.usedByDeviceId, deviceId),
        eq(activationCodes.status, "used"),
        activeActivationCondition()
      )
    )
    .returning({ id: activationCodes.id });

  return updatedRows.length;
}

export async function deleteExpiredUnusedActivationCodes(): Promise<number> {
  const deletedRows = await db
    .delete(activationCodes)
    .where(
      and(
        expiredActivationCondition(),
        eq(activationCodes.status, "unused")
      )
    )
    .returning({ id: activationCodes.id });

  return deletedRows.length;
}

export async function getActivationCleanupStats(): Promise<ActivationCleanupStatsRecord> {
  const [cleanableExpiredResult, overview] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(activationCodes)
      .where(
        and(
          expiredActivationCondition(),
          eq(activationCodes.status, "unused")
        )
      ),
    getActivationOverviewStats(),
  ]);

  return {
    cleanableExpired: toNumber(cleanableExpiredResult[0]?.count),
    totalExpired: overview.expiredCodes,
    totalCodes: overview.totalCodes,
    unusedCodes: overview.unusedCodes,
    usedCodes: overview.usedCodes,
  };
}

export async function getActivationOverviewStats(): Promise<ActivationOverviewStatsRecord> {
  const result = await db
    .select({
      totalCodes: sql<number>`count(*)`,
      unusedCodes: sql<number>`count(case when ${activationCodes.status} = 'unused' then 1 end)`,
      usedCodes: sql<number>`count(case when ${activationCodes.status} = 'used' then 1 end)`,
      expiredCodes: sql<number>`count(case when ${activationCodes.expiresAt} is not null and ${activationCodes.expiresAt} <= CURRENT_TIMESTAMP then 1 end)`,
    })
    .from(activationCodes);

  return {
    totalCodes: toNumber(result[0]?.totalCodes),
    unusedCodes: toNumber(result[0]?.unusedCodes),
    usedCodes: toNumber(result[0]?.usedCodes),
    expiredCodes: toNumber(result[0]?.expiredCodes),
  };
}

export async function getActivationDetailedStats(): Promise<ActivationDetailedStatsRecord> {
  const [
    overview,
    deviceStatsResult,
    expiryStatsResult,
    recentCreatedResult,
    activationTrendRows,
    hourlyActivationRows,
  ] = await Promise.all([
    getActivationOverviewStats(),
    db
      .select({
        uniqueDevices: sql<number>`count(distinct ${activationCodes.usedByDeviceId})`,
        totalActivations: sql<number>`count(*)`,
      })
      .from(activationCodes)
      .where(isNotNull(activationCodes.usedByDeviceId)),
    db
      .select({
        neverExpire: sql<number>`count(case when ${activationCodes.expiresAt} is null then 1 end)`,
        valid: sql<number>`count(case when ${activationCodes.expiresAt} > CURRENT_TIMESTAMP then 1 end)`,
        expired: sql<number>`count(case when ${activationCodes.expiresAt} is not null and ${activationCodes.expiresAt} <= CURRENT_TIMESTAMP then 1 end)`,
      })
      .from(activationCodes),
    db
      .select({
        today: sql<number>`count(case when ${activationCodes.createdAt} >= CURRENT_DATE then 1 end)`,
        thisWeek: sql<number>`count(case when ${activationCodes.createdAt} >= CURRENT_DATE - INTERVAL '7 days' then 1 end)`,
        thisMonth: sql<number>`count(case when ${activationCodes.createdAt} >= CURRENT_DATE - INTERVAL '30 days' then 1 end)`,
      })
      .from(activationCodes),
    db
      .select({
        date: sql<string>`DATE(${activationCodes.usedAt})::text`,
        activations: sql<number>`count(*)`,
      })
      .from(activationCodes)
      .where(
        and(
          isNotNull(activationCodes.usedAt),
          sql`${activationCodes.usedAt} >= CURRENT_DATE - INTERVAL '30 days'`
        )
      )
      .groupBy(sql`DATE(${activationCodes.usedAt})`)
      .orderBy(desc(sql`DATE(${activationCodes.usedAt})`))
      .limit(30),
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${activationCodes.usedAt})::int`,
        activations: sql<number>`count(*)`,
      })
      .from(activationCodes)
      .where(
        and(
          isNotNull(activationCodes.usedAt),
          sql`DATE(${activationCodes.usedAt}) = CURRENT_DATE`
        )
      )
      .groupBy(sql`EXTRACT(HOUR FROM ${activationCodes.usedAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${activationCodes.usedAt})`),
  ]);

  const deviceStats = deviceStatsResult[0];
  const expiryStats = expiryStatsResult[0];
  const recentCreated = recentCreatedResult[0];

  const uniqueDevices = toNumber(deviceStats?.uniqueDevices);
  const totalActivations = toNumber(deviceStats?.totalActivations);
  const hourlyActivationsByHour = new Map(
    hourlyActivationRows.map((row) => [toNumber(row.hour), toNumber(row.activations)])
  );

  return {
    overview,
    devices: {
      uniqueDevices,
      totalActivations,
      averageActivationsPerDevice: uniqueDevices > 0 ? totalActivations / uniqueDevices : 0,
    },
    expiry: {
      neverExpire: toNumber(expiryStats?.neverExpire),
      valid: toNumber(expiryStats?.valid),
      expired: toNumber(expiryStats?.expired),
    },
    recentCreated: {
      today: toNumber(recentCreated?.today),
      thisWeek: toNumber(recentCreated?.thisWeek),
      thisMonth: toNumber(recentCreated?.thisMonth),
    },
    activationTrend: activationTrendRows
      .map((row) => ({
        date: String(row.date),
        activations: toNumber(row.activations),
      }))
      .reverse(),
    hourlyActivations: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activations: hourlyActivationsByHour.get(hour) ?? 0,
    })),
  };
}

export async function insertActivationCodes(
  codes: Array<{ code: string; expires_at?: Date | null; validity_days?: number | null }>
): Promise<ActivationCodeRecord[]> {
  const rows = await db
    .insert(activationCodes)
    .values(
      codes.map((item) => ({
        code: item.code,
        expiresAt: item.expires_at ?? null,
        validityDays: item.validity_days ?? null,
      }))
    )
    .returning();

  return rows.map(mapActivationCodeRow);
}

export async function resetActivationCodeById(codeId: number): Promise<boolean> {
  const rows = await db
    .update(activationCodes)
    .set({
      status: "unused",
      usedByDeviceId: null,
      usedAt: null,
      updatedAt: CURRENT_TIMESTAMP_SQL,
    })
    .where(eq(activationCodes.id, codeId))
    .returning({ id: activationCodes.id });

  return rows.length > 0;
}

export async function validateActivationCodeForDevice(
  code: string,
  deviceId: string
): Promise<ActivationValidationResult> {
  return await db.transaction(async (tx) => {
    const existingActivationRows = await tx
      .select({
        code: activationCodes.code,
        expires_at: activationCodes.expiresAt,
      })
      .from(activationCodes)
      .where(
        and(
          eq(activationCodes.usedByDeviceId, deviceId),
          eq(activationCodes.status, "used"),
          activeActivationCondition()
        )
      )
      .orderBy(desc(activationCodes.usedAt))
      .limit(1);

    if (existingActivationRows.length > 0) {
      return {
        success: false,
        message: "该设备已有有效的激活码，每个设备只能同时使用一个激活码",
      };
    }

    const activationCode = await lockActivationCodeByCode(tx, code);

    if (!activationCode) {
      return { success: false, message: "激活码不存在" };
    }

    if (activationCode.status === "used") {
      return { success: false, message: "激活码已被使用" };
    }

    if (
      activationCode.validity_days === null &&
      activationCode.expires_at &&
      activationCode.expires_at < new Date()
    ) {
      return { success: false, message: "激活码已过期" };
    }

    let calculatedExpiresAt = activationCode.expires_at;
    if (activationCode.validity_days !== null) {
      const now = new Date();
      calculatedExpiresAt = new Date(
        now.getTime() + activationCode.validity_days * 24 * 60 * 60 * 1000
      );
    }

    const updatedRows = await tx
      .update(activationCodes)
      .set({
        status: "used",
        usedByDeviceId: deviceId,
        usedAt: CURRENT_TIMESTAMP_SQL,
        expiresAt: calculatedExpiresAt,
        updatedAt: CURRENT_TIMESTAMP_SQL,
      })
      .where(eq(activationCodes.id, activationCode.id))
      .returning();

    const updatedActivationCode = updatedRows[0]
      ? mapActivationCodeRow(updatedRows[0])
      : ({
          ...activationCode,
          status: "used",
          used_by_device_id: deviceId,
          used_at: new Date(),
          expires_at: calculatedExpiresAt,
        } satisfies ActivationCodeRecord);

    return {
      success: true,
      message: "激活成功",
      activationCode: updatedActivationCode,
    };
  });
}
