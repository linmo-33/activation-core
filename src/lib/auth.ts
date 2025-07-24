import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// JWT密钥获取逻辑：优先文件 -> 环境变量 -> 默认值
function getJWTSecret(): Uint8Array {
  const JWT_SECRET_FILE = '/app/data/.jwt-secret'
  
  try {
    // 尝试从文件读取
    if (fs.existsSync(JWT_SECRET_FILE)) {
      const secretFromFile = fs.readFileSync(JWT_SECRET_FILE, 'utf8').trim()
      if (secretFromFile) {
        return new TextEncoder().encode(secretFromFile)
      }
    }
  } catch (error) {
    console.warn('[WARNING] 无法读取JWT密钥文件，使用环境变量或默认值')
  }
  
  // Fallback到环境变量或默认值
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
  return new TextEncoder().encode(secret)
}

const JWT_SECRET = getJWTSecret()

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createJWT(payload: { username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
} 

/**
 * 生成安全的JWT密钥并保存到文件
 * @returns 生成的密钥字符串
 */
export function generateJWTSecret(): string {
  const JWT_SECRET_FILE = '/app/data/.jwt-secret'
  
  try {
    // 生成256位随机密钥
    const secret = crypto.randomBytes(32).toString('base64')
    
    // 确保目录存在
    const dir = path.dirname(JWT_SECRET_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // 写入文件并设置权限
    fs.writeFileSync(JWT_SECRET_FILE, secret, 'utf8')
    fs.chmodSync(JWT_SECRET_FILE, 0o600) // 仅owner可读写
    
    return secret
  } catch (error) {
    console.error('[ERROR] JWT密钥生成失败:', error)
    throw error
  }
}

/**
 * 生成强密码
 * @param length 密码长度，默认12位
 * @returns 随机强密码
 */
export function generateStrongPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + special
  
  let password = ''
  
  // 确保包含每种字符类型
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // 填充剩余长度
  for (let i = 4; i < length; i++) {
    const randomBytes = crypto.randomBytes(1)
    password += allChars[randomBytes[0] % allChars.length]
  }
  
  // 打乱字符顺序
  return password.split('').sort(() => 0.5 - Math.random()).join('')
} 