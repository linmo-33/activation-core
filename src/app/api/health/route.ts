import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version?: string
  database: {
    status: 'connected' | 'disconnected'
    responseTime?: number
  }
  memory?: {
    used: number
    total: number
    percentage: number
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 基础健康信息
    const healthData: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: 'disconnected'
      }
    }

    // 添加内存使用情况
    if (process.memoryUsage) {
      const memUsage = process.memoryUsage()
      healthData.memory = {
        used: Math.round(memUsage.rss / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.rss / memUsage.heapTotal) * 100)
      }
    }

    // 检查数据库连接
    try {
      const dbStartTime = Date.now()
      
      // 简单的数据库连接测试
      await prisma.$executeRaw`SELECT 1`
      
      const dbResponseTime = Date.now() - dbStartTime
      healthData.database = {
        status: 'connected',
        responseTime: dbResponseTime
      }
      
    } catch (dbError) {
      console.error('数据库健康检查失败:', dbError)
      healthData.database = {
        status: 'disconnected'
      }
      healthData.status = 'unhealthy'
    }

    // 根据检查结果返回适当的HTTP状态码
    const httpStatus = healthData.status === 'healthy' ? 200 : 503

    return new Response(JSON.stringify(healthData, null, 2), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('健康检查失败:', error)
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'disconnected'
      }
    }

    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

// 只允许GET方法
export async function POST() {
  return new Response(JSON.stringify({ error: '方法不被允许' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function PUT() {
  return new Response(JSON.stringify({ error: '方法不被允许' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function DELETE() {
  return new Response(JSON.stringify({ error: '方法不被允许' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  })
} 