import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成密码学安全的随机激活码
 * @param length 激活码长度 (默认20)
 * @returns 混合大小写字母和数字的激活码，如：U2m9Lw2cjOaV8WQDx3Hy
 */
export function generateActivationCode(length: number = 20): string {
  // 优化的字符集：移除容易混淆的字符 (0,O,1,I,l,i)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

  // 使用密码学安全的随机数生成器
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // 浏览器环境或支持 Web Crypto API 的环境
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    return Array.from(array, byte => chars[byte % chars.length]).join('');
  } else {
    // Node.js 环境
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(length);

    return Array.from(bytes, (byte: number) => chars[byte % chars.length]).join('');
  }
}

/**
 * 批量生成唯一激活码（优化版本）
 * @param count 生成数量
 * @param length 激活码长度 (默认20)
 * @param maxAttempts 最大重试次数 (默认1000)
 * @returns 唯一激活码数组
 */
export function generateUniqueActivationCodes(
  count: number,
  length: number = 20,
  maxAttempts: number = 1000
): string[] {
  const codes = new Set<string>();
  let attempts = 0;

  while (codes.size < count && attempts < maxAttempts) {
    const code = generateActivationCode(length);
    codes.add(code);
    attempts++;
  }

  if (codes.size < count) {
    throw new Error(`无法生成 ${count} 个唯一激活码，请减少数量或增加长度`);
  }

  return Array.from(codes);
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
 * 格式化日期时间为中国时间格式
 * @param date 日期对象或字符串
 * @returns 格式化后的中国时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTime(date: Date | string | null): string | null {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  return d.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * 格式化日期时间为 API 响应格式
 * 统一返回中国时间格式，用于所有 API 响应
 * @param date 日期对象或字符串
 * @returns 中国时间格式字符串或 null
 */
export function formatDateTimeForAPI(date: Date | string | null): string | null {
  return formatDateTime(date);
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


