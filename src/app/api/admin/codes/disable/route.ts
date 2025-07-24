import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export const runtime = 'nodejs';

interface DisableRequestBody {
  id?: unknown
  code?: unknown
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token || !(await verifyJWT(token))) {
      return createErrorResponse('未授权访问', 401)
    }

    const body: DisableRequestBody = await request.json()
    const { id, code } = body

    if (!id && !code) {
      return createErrorResponse('必须提供激活码ID或激活码', 400)
    }

    let whereClause: { id?: number; code?: string }

    if (id) {
      if (typeof id !== 'number' || id <= 0) {
        return createErrorResponse('激活码ID必须是有效的数字', 400)
      }
      whereClause = { id }
    } else {
      if (typeof code !== 'string' || code.trim().length === 0) {
        return createErrorResponse('激活码必须是有效的字符串', 400)
      }
      whereClause = { code: code.trim().toUpperCase() }
    }

    // 查找激活码
    const activationCode = await prisma.activationCode.findUnique({
      where: whereClause
    })

    if (!activationCode) {
      return createErrorResponse('激活码不存在', 404)
    }

    // 检查激活码是否已经过期
    const now = new Date()
    if (activationCode.expiresAt && activationCode.expiresAt <= now) {
      return createErrorResponse('激活码已经过期，无需失效', 400)
    }

    // 使激活码禁用 - 设置isDisabled为true
    const disabledCode = await prisma.activationCode.update({
      where: whereClause,
      data: {
        isDisabled: true
      }
    })

    return createSuccessResponse(
      { 
        code: disabledCode.code,
        id: disabledCode.id,
        isDisabled: true,
        disabledAt: new Date().toISOString()
      },
      '激活码已禁用'
    )

  } catch (error) {
    console.error('使激活码失效时发生错误:', error)
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