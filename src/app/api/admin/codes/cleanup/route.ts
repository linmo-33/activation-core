import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * 清理过期激活码 API
 * POST /api/admin/codes/cleanup
 */
export async function POST(request: NextRequest) {
  try {
    // 执行清理操作 - 删除过期的激活码
    const cleanupResult = await query(`
      DELETE FROM activation_codes
      WHERE expires_at IS NOT NULL
      AND expires_at <= CURRENT_TIMESTAMP
      AND status = 'unused'
    `);

    const cleanedCount = cleanupResult.rowCount || 0;

    // 可选：同时清理一些其他过期数据
    // 例如：清理超过一定时间的已使用激活码（如果需要的话）
    
    return NextResponse.json(
      {
        success: true,
        message: `成功清理 ${cleanedCount} 个过期激活码`,
        data: {
          cleaned: cleanedCount,
          cleanup_time: new Date().toISOString(),
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
    const expiredResult = await query(`
      SELECT COUNT(*) as expired_count
      FROM activation_codes
      WHERE expires_at IS NOT NULL
      AND expires_at <= CURRENT_TIMESTAMP
      AND status = 'unused'
    `);

    // 统计总的过期激活码（包括已使用的）
    const totalExpiredResult = await query(`
      SELECT COUNT(*) as total_expired
      FROM activation_codes
      WHERE expires_at IS NOT NULL
      AND expires_at <= CURRENT_TIMESTAMP
    `);

    // 统计数据库大小相关信息（如果需要的话）
    const sizeResult = await query(`
      SELECT 
        COUNT(*) as total_codes,
        COUNT(CASE WHEN status = 'unused' THEN 1 END) as unused_codes,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as used_codes
      FROM activation_codes
    `);

    const expiredCount = parseInt(expiredResult.rows[0].expired_count) || 0;
    const totalExpired = parseInt(totalExpiredResult.rows[0].total_expired) || 0;
    const stats = sizeResult.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: '获取清理统计信息成功',
        data: {
          cleanable_expired: expiredCount,
          total_expired: totalExpired,
          database_stats: {
            total_codes: parseInt(stats.total_codes) || 0,
            unused_codes: parseInt(stats.unused_codes) || 0,
            used_codes: parseInt(stats.used_codes) || 0
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
