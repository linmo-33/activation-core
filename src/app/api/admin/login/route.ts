import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, createJWT } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // 验证请求参数
    if (!username || typeof username !== 'string') {
      return createErrorResponse('用户名不能为空', 400)
    }

    if (!password || typeof password !== 'string') {
      return createErrorResponse('密码不能为空', 400)
    }

    // 查找管理员账户
    const admin = await prisma.admin.findUnique({
      where: { username: username.trim() }
    })

    if (!admin) {
      return createErrorResponse('用户名或密码错误', 401)
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, admin.password)
    if (!isPasswordValid) {
      return createErrorResponse('用户名或密码错误', 401)
    }

    // 生成JWT token
    const token = await createJWT({ username: admin.username })

    // 创建响应，设置httpOnly cookie
    const response = createSuccessResponse(
      { username: admin.username },
      '登录成功'
    )

    // 设置cookie - 在开发环境中不使用Secure标志
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = [
      `auth-token=${token}`,
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${24 * 60 * 60}`,
      'Path=/',
      ...(isProduction ? ['Secure'] : [])
    ].join('; ')

    response.headers.set('Set-Cookie', cookieOptions)

    return response

  } catch (error) {
    console.error('管理员登录时发生错误:', error)
    return createErrorResponse('服务器内部错误', 500)
  }
}

// 仅允许POST方法
export async function GET() {
  return createErrorResponse('方法不被允许', 405)
}

export async function PUT() {
  return createErrorResponse('方法不被允许', 405)
}

export async function DELETE() {
  return createErrorResponse('方法不被允许', 405)
} 