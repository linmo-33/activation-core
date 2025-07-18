import crypto from 'crypto'

/**
 * 生成激活码
 * @param length 激活码长度，默认16位
 * @returns 随机激活码字符串
 */
export function generateActivationCode(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  // 使用crypto模块生成安全的随机字节
  const randomBytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    // 使用随机字节的值来选择字符，确保均匀分布
    const randomIndex = randomBytes[i] % chars.length
    result += chars.charAt(randomIndex)
  }
  
  return result
}

/**
 * 检查IP是否在白名单中
 * @param clientIp 客户端IP
 * @param whitelist IP白名单数组
 * @returns 是否允许访问
 */
export function isIpAllowed(clientIp: string, whitelist: string[]): boolean {
  if (whitelist.length === 0) return true
  
  // 支持localhost的多种表示方式
  const normalizedIp = normalizeIp(clientIp)
  
  return whitelist.some(allowedIp => {
    const normalizedAllowed = normalizeIp(allowedIp)
    return normalizedIp === normalizedAllowed || 
           allowedIp === '0.0.0.0' || // 允许所有IP
           allowedIp === '*' // 通配符
  })
}

/**
 * 标准化IP地址
 */
function normalizeIp(ip: string): string {
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1'
  if (ip === '::ffff:0.0.0.0') return '0.0.0.0'
  return ip
}

/**
 * 格式化错误响应
 */
export function createErrorResponse(message: string, status: number = 400) {
  return Response.json(
    { success: false, message },
    { status }
  )
}

/**
 * 格式化成功响应
 */
export function createSuccessResponse(data?: Record<string, unknown>, message?: string) {
  return Response.json({
    success: true,
    message,
    ...data
  })
} 