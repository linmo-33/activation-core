import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * 获取激活码统计数据 API
 * GET /api/admin/stats
 */
export async function GET() {
  try {
    // 使用数据库视图获取统计数据
    const result = await query('SELECT * FROM activation_codes_stats');
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: '获取统计数据成功',
          data: {
            total: 0,
            unused: 0,
            used: 0,
            expired: 0,
          }
        },
        { status: 200 }
      );
    }

    const stats = result.rows[0];
    
    return NextResponse.json(
      {
        success: true,
        message: '获取统计数据成功',
        data: {
          total: parseInt(stats.total_codes) || 0,
          unused: parseInt(stats.unused_codes) || 0,
          used: parseInt(stats.used_codes) || 0,
          expired: parseInt(stats.expired_codes) || 0,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('获取统计数据API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '获取统计数据失败'
      },
      { status: 500 }
    );
  }
}
