export type ActivationCodeTypeKey =
  | "permanent"
  | "relative_1d"
  | "relative_30d"
  | "relative_nd"
  | "absolute_deadline";

export interface ActivationCodeTypeMeta {
  key: ActivationCodeTypeKey;
  title: string;
  subtitle: string;
  description: string;
  accentClassName: string;
  badgeClassName: string;
}

export interface ActivationCodeTypeInput {
  validityDays: number | null;
  expiresAt: string | Date | null;
}

const activationCodeTypeMetaMap: Record<Exclude<ActivationCodeTypeKey, "relative_nd">, ActivationCodeTypeMeta> = {
  permanent: {
    key: "permanent",
    title: "永久卡",
    subtitle: "不设置过期时间",
    description: "不会自动过期。适合长期授权、高等级设备或固定客户场景。",
    accentClassName: "border-neutral-900 bg-neutral-950 text-stone-100",
    badgeClassName: "border-amber-300/40 bg-neutral-950 text-amber-100",
  },
  relative_1d: {
    key: "relative_1d",
    title: "日卡",
    subtitle: "激活后 24 小时有效",
    description: "用户激活后 24 小时内有效。适合试用或短期使用。",
    accentClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  relative_30d: {
    key: "relative_30d",
    title: "月卡",
    subtitle: "激活后固定 30 天有效",
    description: "用户激活后固定 30 天有效。适合按固定周期销售。",
    accentClassName: "border-violet-200 bg-violet-50 text-violet-900",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-900",
  },
  absolute_deadline: {
    key: "absolute_deadline",
    title: "截止时间卡",
    subtitle: "到固定时间点失效",
    description: "到固定时间点自动失效，适合活动批次或统一截止场景。",
    accentClassName: "border-amber-200 bg-amber-50 text-amber-900",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-900",
  },
};

export const generateActivationCodeTypeOptions: ActivationCodeTypeMeta[] = [
  activationCodeTypeMetaMap.permanent,
  activationCodeTypeMetaMap.relative_1d,
  activationCodeTypeMetaMap.relative_30d,
  activationCodeTypeMetaMap.absolute_deadline,
];

export function getRelativeDaysActivationCodeTypeMeta(days: number): ActivationCodeTypeMeta {
  return {
    key: "relative_nd",
    title: "时长卡",
    subtitle: `激活后固定 ${days} 天有效`,
    description: `用户激活后固定 ${days} 天有效。`,
    accentClassName: "border-sky-200 bg-sky-50 text-sky-900",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-900",
  };
}

export function getActivationCodeTypeMeta(input: ActivationCodeTypeInput): ActivationCodeTypeMeta {
  if (input.validityDays === 1) {
    return activationCodeTypeMetaMap.relative_1d;
  }

  if (input.validityDays === 30) {
    return activationCodeTypeMetaMap.relative_30d;
  }

  if (typeof input.validityDays === "number" && input.validityDays > 0) {
    return getRelativeDaysActivationCodeTypeMeta(input.validityDays);
  }

  if (input.expiresAt) {
    return activationCodeTypeMetaMap.absolute_deadline;
  }

  return activationCodeTypeMetaMap.permanent;
}
