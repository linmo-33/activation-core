import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export const runtime = 'nodejs';

interface WhereClause {
  OR?: object[]
  isSuccess?: boolean
  activationCodeId?: number
  machineId?: string
  createdAt?: {
    gte?: Date
    lte?: Date
  }
  ipAddress?: {
    not: null
  }
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token || !(await verifyJWT(token))) {
      return createErrorResponse('未授权访问', 401)
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const success = searchParams.get('success') // 'true', 'false', 或 null
    const codeId = searchParams.get('codeId') // 特定激活码ID
    const machineId = searchParams.get('machineId') // 特定机器ID
    const startDate = searchParams.get('startDate') // 开始日期
    const endDate = searchParams.get('endDate') // 结束日期

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: WhereClause = {}

    if (search) {
      where.OR = [
        { machineId: { contains: search } },
        { ipAddress: { contains: search } },
        { userAgent: { contains: search } },
        { country: { contains: search } },
        { city: { contains: search } },
        { errorMessage: { contains: search } },
        { activationCode: { contains: search.toUpperCase() } }
      ]
    }

    if (success !== null) {
      where.isSuccess = success === 'true'
    }

    if (codeId) {
      where.activationCodeId = parseInt(codeId)
    }

    if (machineId) {
      where.machineId = machineId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
      }
    }

    // 查询激活日志
    const [logs, total] = await Promise.all([
      prisma.activationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.activationLog.count({ where })
    ])

    // 统计信息
    const stats = await prisma.activationLog.groupBy({
      by: ['isSuccess'],
      _count: true,
      where: startDate || endDate ? { createdAt: where.createdAt } : undefined
    })

    const statsData = {
      total,
      success: stats.find((s: { isSuccess: boolean; _count: number }) => s.isSuccess)?._count || 0,
      failed: stats.find((s: { isSuccess: boolean; _count: number }) => !s.isSuccess)?._count || 0,
      uniqueMachines: await prisma.activationLog.groupBy({
        by: ['machineId'],
        where: { isSuccess: true, ...where },
        _count: true
      }).then((result: Array<{ machineId: string; _count: number }>) => result.length),
      uniqueIPs: await prisma.activationLog.groupBy({
        by: ['ipAddress'],
        where: { 
          isSuccess: true, 
          ipAddress: { not: null },
          ...where 
        },
        _count: true
      }).then((result: Array<{ ipAddress: string | null; _count: number }>) => result.length)
    }

    return createSuccessResponse({
      logs,
      stats: statsData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, '获取激活日志成功')

  } catch (error) {
    console.error('获取激活日志失败:', error)
    return createErrorResponse('服务器内部错误', 500)
  }
} 