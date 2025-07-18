import { createSuccessResponse, createErrorResponse } from '@/lib/utils'

export async function POST() {
  try {
    // 创建响应，清除auth-token cookie
    const response = createSuccessResponse(null, '登出成功')

    // 清除cookie - 在开发环境中不使用Secure标志
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = [
      'auth-token=',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=0',
      'Path=/',
      ...(isProduction ? ['Secure'] : [])
    ].join('; ')

    response.headers.set('Set-Cookie', cookieOptions)

    return response

  } catch (error) {
    console.error('管理员登出时发生错误:', error)
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