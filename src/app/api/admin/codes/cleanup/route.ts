import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredUnusedCodes, getActivationCleanupStats } from '@/server/activation';
import { formatDateTimeForAPI } from '@/lib/utils';

/**
 * 清理过期激活码 API
 * POST /api/admin/codes/cleanup
 */
export async function POST(request: NextRequest) {
  try {
    // 执行清理操作 - 删除过期的激活码
    const cleanedCount = await cleanupExpiredUnusedCodes();

    // 可选：同时清理一些其他过期数据
    // 例如：清理超过一定时间的已使用激活码（如果需要的话）
    
    return NextResponse.json(
      {
        success: true,
        message: `成功清理 ${cleanedCount} 个过期激活码`,
        data: {
          cleaned: cleanedCount,
          cleanup_time: formatDateTimeForAPI(new Date()),
          operation: 'delete_expired_unused_codes'
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('清理过期激活码失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '清理操作失败：' + error.message
      },
      { status: 500 }
    );
  }
}

/**
 * 获取清理统计信息
 * GET /api/admin/codes/cleanup
 */
export async function GET() {
  try {
    // 统计可清理的过期激活码数量
    const stats = await getActivationCleanupStats();
    const expiredCount = stats.cleanableExpired;
    const totalExpired = stats.totalExpired;

    return NextResponse.json(
      {
        success: true,
        message: '获取清理统计信息成功',
        data: {
          cleanable_expired: expiredCount,
          total_expired: totalExpired,
          database_stats: {
            total_codes: stats.totalCodes,
            unused_codes: stats.unusedCodes,
            used_codes: stats.usedCodes
          },
          recommendations: {
            should_cleanup: expiredCount > 0,
            cleanup_benefit: expiredCount > 100 ? 'high' : expiredCount > 10 ? 'medium' : 'low'
          }
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('获取清理统计失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '获取统计信息失败：' + error.message
      },
      { status: 500 }
    );
  }
}
