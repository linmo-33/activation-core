import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * 系统健康检查 API
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();
  const checks: any = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  };

  try {
    // 检查数据库连接
    try {
      const dbStart = Date.now();
      await query('SELECT 1 as health_check');
      const dbDuration = Date.now() - dbStart;
      
      checks.checks.database = {
        status: 'healthy',
        responseTime: `${dbDuration}ms`,
        message: '数据库连接正常'
      };
    } catch (error: any) {
      checks.status = 'unhealthy';
      checks.checks.database = {
        status: 'unhealthy',
        error: error.message,
        message: '数据库连接失败'
      };
    }

    // 检查环境变量
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length === 0) {
      checks.checks.environment = {
        status: 'healthy',
        message: '环境变量配置正常'
      };
    } else {
      checks.status = 'unhealthy';
      checks.checks.environment = {
        status: 'unhealthy',
        missing: missingEnvVars,
        message: `缺少必要的环境变量: ${missingEnvVars.join(', ')}`
      };
    }

    // 检查系统统计
    try {
      const statsResult = await query('SELECT * FROM activation_codes_stats');
      const stats = statsResult.rows[0];
      
      checks.checks.statistics = {
        status: 'healthy',
        data: {
          totalCodes: stats.total_codes,
          unusedCodes: stats.unused_codes,
          usedCodes: stats.used_codes,
          expiredCodes: stats.expired_codes
        },
        message: '统计数据正常'
      };
    } catch (error: any) {
      checks.checks.statistics = {
        status: 'warning',
        error: error.message,
        message: '无法获取统计数据'
      };
    }

    // 计算总响应时间
    const totalDuration = Date.now() - startTime;
    checks.responseTime = `${totalDuration}ms`;

    // 确定整体状态
    const hasUnhealthy = Object.values(checks.checks).some((check: any) => check.status === 'unhealthy');
    if (hasUnhealthy) {
      checks.status = 'unhealthy';
    }

    const statusCode = checks.status === 'healthy' ? 200 : 503;

    return NextResponse.json(checks, { status: statusCode });

  } catch (error: any) {
    console.error('健康检查失败:', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
        message: '系统健康检查失败',
        responseTime: `${Date.now() - startTime}ms`
      },
      { status: 503 }
    );
  }
}

/**
 * 简单的存活检查
 * HEAD /api/health
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}


