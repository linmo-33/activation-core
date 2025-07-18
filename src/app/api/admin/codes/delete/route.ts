import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

interface DeleteRequestBody {
  ids?: unknown[]
  codes?: unknown[]
}

interface SingleDeleteRequestBody {
  id?: unknown
  code?: unknown
}

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteRequestBody = await request.json()
    const { ids, codes } = body

    // 验证请求参数 - 支持通过ID或激活码删除
    if ((!ids || !Array.isArray(ids)) && (!codes || !Array.isArray(codes))) {
      return createErrorResponse('必须提供要删除的激活码ID数组或激活码数组', 400)
    }

    if (ids && ids.length === 0 && codes && codes.length === 0) {
      return createErrorResponse('删除列表不能为空', 400)
    }

    // 限制批量删除数量
    const maxBatchSize = 100
    const itemsToDelete = ids ? ids.length : codes!.length
    if (itemsToDelete > maxBatchSize) {
      return createErrorResponse(`一次最多删除 ${maxBatchSize} 个激活码`, 400)
    }

    let deleteCount = 0

    if (ids && ids.length > 0) {
      // 通过ID删除
      // 验证所有ID都是数字
      if (!ids.every((id: unknown) => typeof id === 'number' && id > 0)) {
        return createErrorResponse('激活码ID必须是有效的数字', 400)
      }

      // 执行删除
      const result = await prisma.activationCode.deleteMany({
        where: {
          id: {
            in: ids as number[]
          }
        }
      })

      deleteCount = result.count
    } else if (codes && codes.length > 0) {
      // 通过激活码删除
      // 验证所有激活码都是字符串
      if (!codes.every((code: unknown) => typeof code === 'string' && code.trim().length > 0)) {
        return createErrorResponse('激活码必须是有效的字符串', 400)
      }

      // 转换为大写
      const upperCaseCodes = (codes as string[]).map((code: string) => code.trim().toUpperCase())

      // 执行删除
      const result = await prisma.activationCode.deleteMany({
        where: {
          code: {
            in: upperCaseCodes
          }
        }
      })

      deleteCount = result.count
    }

    if (deleteCount === 0) {
      return createErrorResponse('没有找到要删除的激活码', 404)
    }

    return createSuccessResponse(
      { deletedCount: deleteCount },
      `成功删除 ${deleteCount} 个激活码`
    )

  } catch (error) {
    console.error('删除激活码时发生错误:', error)
    return createErrorResponse('服务器内部错误', 500)
  }
}

// 支持单个激活码删除的便捷接口
export async function POST(request: NextRequest) {
  try {
    const body: SingleDeleteRequestBody = await request.json()
    const { id, code } = body

    if (!id && !code) {
      return createErrorResponse('必须提供激活码ID或激活码', 400)
    }

    let deleteResult

    if (id) {
      if (typeof id !== 'number' || id <= 0) {
        return createErrorResponse('激活码ID必须是有效的数字', 400)
      }

      deleteResult = await prisma.activationCode.delete({
        where: { id }
      })
    } else {
      if (typeof code !== 'string' || code.trim().length === 0) {
        return createErrorResponse('激活码必须是有效的字符串', 400)
      }

      deleteResult = await prisma.activationCode.delete({
        where: { code: code.trim().toUpperCase() }
      })
    }

    return createSuccessResponse(
      { deletedCode: deleteResult },
      '激活码删除成功'
    )

  } catch (error) {
    // Prisma错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string }
      if (prismaError.code === 'P2025') {
        return createErrorResponse('激活码不存在', 404)
      }
    }
    
    console.error('删除激活码时发生错误:', error)
    return createErrorResponse('服务器内部错误', 500)
  }
}

// 仅允许DELETE和POST方法
export async function GET() {
  return createErrorResponse('方法不被允许', 405)
}

export async function PUT() {
  return createErrorResponse('方法不被允许', 405)
} 