/**
 * 频率限制工具
 * 基于内存的简单频率限制实现，适合 Serverless 环境
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 内存存储，在 Serverless 环境中每个实例独立
const rateLimitStore = new Map<string, RateLimitEntry>();

// 清理过期记录的定时器
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * 清理过期的频率限制记录
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 启动清理定时器
 */
function startCleanupTimer() {
  if (!cleanupTimer) {
    // 每5分钟清理一次过期记录
    cleanupTimer = setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
  }
}

/**
 * 频率限制配置
 */
export interface RateLimitConfig {
  /** 时间窗口内允许的最大请求数 */
  maxRequests: number;
  /** 时间窗口大小（毫秒） */
  windowMs: number;
  /** 限制键前缀 */
  keyPrefix?: string;
}

/**
 * 频率限制结果
 */
export interface RateLimitResult {
  /** 是否被限制 */
  limited: boolean;
  /** 当前请求数 */
  count: number;
  /** 剩余请求数 */
  remaining: number;
  /** 重置时间戳 */
  resetTime: number;
  /** 距离重置还有多少毫秒 */
  resetTimeMs: number;
}

/**
 * 检查频率限制
 * @param key 限制键（如 IP 地址或设备 ID）
 * @param config 频率限制配置
 * @returns 频率限制结果
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  startCleanupTimer();

  const now = Date.now();
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

  let entry = rateLimitStore.get(fullKey);
  
  // 如果记录不存在或已过期，创建新记录
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(fullKey, entry);
    
    return {
      limited: false,
      count: 1,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
      resetTimeMs: config.windowMs
    };
  }
  
  // 增加请求计数
  entry.count++;
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const limited = entry.count > config.maxRequests;
  
  return {
    limited,
    count: entry.count,
    remaining,
    resetTime: entry.resetTime,
    resetTimeMs: entry.resetTime - now
  };
}

/**
 * 获取客户端 IP 地址
 * @param request Next.js 请求对象
 * @returns IP 地址
 */
export function getClientIP(request: Request): string {
  // 尝试从各种头部获取真实 IP
  const headers = request.headers;

  // Vercel 和其他代理服务器的标准头部
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for 可能包含多个 IP，取第一个
    const ip = forwardedFor.split(',')[0].trim();
    return ip;
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // 如果都没有，返回默认值
  console.log('⚠️ 无法获取客户端 IP，使用默认标识');
  return 'unknown';
}

/**
 * 预定义的频率限制配置
 */
export const RATE_LIMIT_CONFIGS = {
  // 激活 API 的 IP 限制
  ACTIVATE_IP: {
    maxRequests: process.env.NODE_ENV === 'development' ? 3 : 10, // 开发环境 3 次便于测试
    windowMs: process.env.NODE_ENV === 'development' ? 30 * 1000 : 60 * 1000, // 开发环境 30 秒
    keyPrefix: 'activate_ip'
  } as RateLimitConfig,

  // 激活 API 的设备 ID 限制
  ACTIVATE_DEVICE: {
    maxRequests: process.env.NODE_ENV === 'development' ? 2 : 5, // 开发环境 2 次便于测试
    windowMs: process.env.NODE_ENV === 'development' ? 60 * 1000 : 60 * 60 * 1000, // 开发环境 1 分钟
    keyPrefix: 'activate_device'
  } as RateLimitConfig,

  // 激活 API 的全局限制：每分钟最多 50 次请求
  ACTIVATE_GLOBAL: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 分钟
    keyPrefix: 'activate_global'
  } as RateLimitConfig
};

/**
 * 清理所有频率限制记录（主要用于测试）
 */
export function clearRateLimitStore() {
  rateLimitStore.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
