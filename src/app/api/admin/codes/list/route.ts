import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export const runtime = 'nodejs';

type WhereInput = {
  code?: {
    contains: string
  }
  isUsed?: boolean
  expiresAt?: {
    lte?: Date
    gt?: Date
  } | null
  OR?: Array<{
    expiresAt?: {
      gt?: Date
    } | null
  }>
}

type OrderByInput = {
  createdAt?: 'asc' | 'desc'
  usedAt?: 'asc' | 'desc'
  expiresAt?: 'asc' | 'desc'
  code?: 'asc' | 'desc'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 获取查询参数
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // 最大100条
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, used, unused, expired
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 验证参数
    if (page < 1) {
      return createErrorResponse('页码必须大于0', 400)
    }

    if (limit < 1) {
      return createErrorResponse('每页条数必须大于0', 400)
    }

    // 构建查询条件
    const where: WhereInput = {}
    
    // 搜索条件
    if (search) {
      where.code = {
        contains: search.toUpperCase()
      }
    }

    // 状态筛选
    const now = new Date()
    if (status === 'used') {
      where.isUsed = true
    } else if (status === 'unused') {
      where.isUsed = false
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    } else if (status === 'expired') {
      where.expiresAt = { lte: now }
      where.isUsed = false
    }

    // 排序配置
    const orderBy: OrderByInput = {}
    if (['createdAt', 'usedAt', 'expiresAt', 'code'].includes(sortBy)) {
      const sortField = sortBy as keyof OrderByInput
      orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    // 计算偏移量
    const skip = (page - 1) * limit

    // 查询数据
    const [codes, total] = await Promise.all([
      prisma.activationCode.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          code: true,
          isUsed: true,
          usedAt: true,
          usedBy: true,
          createdAt: true,
          expiresAt: true,
          isDisabled: true
        }
      }),
      prisma.activationCode.count({ where })
    ])

    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // 统计信息
    const stats = await prisma.activationCode.aggregate({
      _count: {
        id: true
      },
      where: {}
    })

    const usedCount = await prisma.activationCode.count({
      where: { isUsed: true }
    })

    const expiredCount = await prisma.activationCode.count({
      where: {
        expiresAt: { lte: now },
        isUsed: false
      }
    })

    return createSuccessResponse({
      codes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      stats: {
        total: stats._count.id,
        used: usedCount,
        unused: stats._count.id - usedCount,
        expired: expiredCount
      }
    })

  } catch (error) {
    console.error('获取激活码列表时发生错误:', error)
    return createErrorResponse('服务器内部错误', 500)
  }
}

// 仅允许GET方法
export async function POST() {
  return createErrorResponse('方法不被允许', 405)
}

export async function PUT() {
  return createErrorResponse('方法不被允许', 405)
}

export async function DELETE() {
  return createErrorResponse('方法不被允许', 405)
} 