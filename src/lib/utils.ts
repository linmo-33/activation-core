import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成随机激活码
 * @param length 激活码长度 (默认20)
 * @returns 混合大小写字母和数字的激活码，如：U2m9Lw2cjOaV8WQDx3Hy
 */
export function generateActivationCode(length: number = 20): string {
  // 包含大写字母、小写字母和数字
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * 清理激活码（移除空格和特殊字符）
 * @param code 用户输入的激活码
 * @returns 清理后的激活码
 */
export function cleanActivationCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, '');
}

/**
 * 验证激活码格式
 * @param code 激活码
 * @returns 是否为有效格式
 */
export function isValidActivationCodeFormat(code: string): boolean {
  const cleanCode = cleanActivationCode(code);
  return cleanCode.length === 20 && /^[A-Za-z0-9]+$/.test(cleanCode);
}

/**
 * 格式化日期时间
 * @param date 日期对象或字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 格式化相对时间
 * @param date 日期对象或字符串
 * @returns 相对时间字符串 (如: 2小时前)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

/**
 * 检查激活码是否已过期
 * @param expiresAt 过期时间
 * @returns 是否已过期
 */
export function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * 获取激活码状态显示文本
 * @param status 状态
 * @param expiresAt 过期时间
 * @returns 状态显示文本
 */
export function getStatusText(status: string, expiresAt?: Date | string | null): string {
  if (status === 'used') return '已使用';
  if (expiresAt && isExpired(expiresAt)) return '已过期';
  return '未使用';
}

/**
 * 获取激活码状态颜色类名
 * @param status 状态
 * @param expiresAt 过期时间
 * @returns Tailwind 颜色类名
 */
export function getStatusColor(status: string, expiresAt?: Date | string | null): string {
  if (status === 'used') return 'text-zinc-500 bg-zinc-100';
  if (expiresAt && isExpired(expiresAt)) return 'text-red-600 bg-red-100';
  return 'text-green-600 bg-green-100';
}
