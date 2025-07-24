import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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

    // 启用激活码
    const enabledCode = await prisma.activationCode.update({
      where: whereClause,
      data: {
        isDisabled: false
      }
    })

    return createSuccessResponse(
      {
        code: enabledCode.code,
        id: enabledCode.id,
        isDisabled: false,
        enabledAt: new Date().toISOString()
      },
      '激活码已启用'
    )
  } catch (error) {
    console.error('启用激活码时发生错误:', error)
    return createErrorResponse('服务器内部错误', 500)
  }
} 