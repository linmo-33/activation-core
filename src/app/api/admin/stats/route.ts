import { NextResponse } from 'next/server';
import { getActivationStats } from '@/server/activation';

/**
 * 获取激活码统计数据 API
 * GET /api/admin/stats
 */
export async function GET() {
  try {
    const stats = await getActivationStats();
    
    return NextResponse.json(
      {
        success: true,
        message: '获取统计数据成功',
        data: {
          total: stats.total,
          unused: stats.unused,
          used: stats.used,
          expired: stats.expired,
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
