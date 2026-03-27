import {
  type ActivationCodeRecord,
  type ActivationCleanupStatsRecord,
  type ActivationDetailedStatsRecord,
  countExpiredActivationsByDevice,
  deleteActivationCodesByIds,
  deleteExpiredUnusedActivationCodes,
  findValidActivationByDevice,
  getActivationCleanupStats as getActivationCleanupStatsFromRepository,
  getActivationDetailedStats as getActivationDetailedStatsFromRepository,
  getActivationOverviewStats as getActivationOverviewStatsFromRepository,
  insertActivationCodes,
  listActivationCodes,
  listDeviceActivationHistory,
  resetActivationCodesByIds,
  resetActivationCodeById,
  resetValidActivationCodesByDevice,
  validateActivationCodeForDevice,
} from "@/db/repositories";

export type ActivationCode = ActivationCodeRecord;
export type ActivationCleanupStats = ActivationCleanupStatsRecord;
export type ActivationDetailedStats = ActivationDetailedStatsRecord;

export async function createActivationCodes(
  codes: Array<{ code: string; expires_at?: Date | null; validity_days?: number | null }>
): Promise<ActivationCode[]> {
  return await insertActivationCodes(codes);
}

export async function batchDeleteActivationCodes(ids: number[]): Promise<number> {
  return await deleteActivationCodesByIds(ids);
}

export async function batchResetActivationCodes(ids: number[]): Promise<number> {
  return await resetActivationCodesByIds(ids);
}

export async function getActivationCodes(filters?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ codes: ActivationCode[]; total: number }> {
  return await listActivationCodes(filters);
}

export async function validateActivationCode(
  code: string,
  deviceId: string
): Promise<{ success: boolean; message: string; activationCode?: ActivationCode }> {
  return await validateActivationCodeForDevice(code, deviceId);
}

export async function resetDeviceValidActivations(deviceId: string): Promise<number> {
  return await resetValidActivationCodesByDevice(deviceId);
}

export async function getDeviceActivationHistory(deviceId: string): Promise<ActivationCode[]> {
  return await listDeviceActivationHistory(deviceId);
}

export async function checkDeviceActivationStatus(deviceId: string): Promise<{
  isActivated: boolean;
  activationCode?: ActivationCode;
  hasExpiredActivations?: boolean;
}> {
  const [activationCode, expiredActivationCount] = await Promise.all([
    findValidActivationByDevice(deviceId),
    countExpiredActivationsByDevice(deviceId),
  ]);
  const hasExpiredActivations = expiredActivationCount > 0;

  if (!activationCode) {
    return {
      isActivated: false,
      hasExpiredActivations,
    };
  }

  return {
    isActivated: true,
    activationCode,
    hasExpiredActivations,
  };
}

export async function cleanupExpiredUnusedCodes(): Promise<number> {
  return await deleteExpiredUnusedActivationCodes();
}

export async function getActivationCleanupStats(): Promise<ActivationCleanupStats> {
  return await getActivationCleanupStatsFromRepository();
}

export async function getActivationStats(): Promise<{
  total: number;
  unused: number;
  used: number;
  expired: number;
}> {
  const stats = await getActivationOverviewStatsFromRepository();

  return {
    total: stats.totalCodes,
    unused: stats.unusedCodes,
    used: stats.usedCodes,
    expired: stats.expiredCodes,
  };
}

export async function getDetailedActivationStats(): Promise<ActivationDetailedStats> {
  return await getActivationDetailedStatsFromRepository();
}

export async function resetActivationCode(codeId: number): Promise<boolean> {
  return await resetActivationCodeById(codeId);
}
