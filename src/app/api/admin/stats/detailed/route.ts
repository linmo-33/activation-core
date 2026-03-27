import { NextResponse } from 'next/server';
import { getDetailedActivationStats } from '@/server/activation';

/**
 * 获取详细统计数据 API
 * GET /api/admin/stats/detailed
 */
export async function GET() {
  try {
    const stats = await getDetailedActivationStats();
    const totalCodes = stats.overview.totalCodes;
    const usedCodes = stats.overview.usedCodes;
    const totalActivations = stats.devices.totalActivations;

    return NextResponse.json(
      {
        success: true,
        message: '获取详细统计数据成功',
        data: {
          // 基础统计
          overview: {
            total_codes: totalCodes,
            unused_codes: stats.overview.unusedCodes,
            used_codes: usedCodes,
            expired_codes: stats.overview.expiredCodes,
            usage_rate: totalCodes > 0 ? parseFloat(((usedCodes / totalCodes) * 100).toFixed(1)) : 0,
            active_rate: totalCodes > 0 ? (((totalCodes - stats.overview.expiredCodes) / totalCodes) * 100).toFixed(1) : '0.0'
          },
          
          // 设备统计
          devices: {
            unique_devices: stats.devices.uniqueDevices,
            total_activations: totalActivations,
            average_activations_per_device: parseFloat(stats.devices.averageActivationsPerDevice.toFixed(1))
          },
          
          // 过期统计
          expiry: {
            never_expire: stats.expiry.neverExpire,
            valid: stats.expiry.valid,
            expired: stats.expiry.expired
          },
          
          // 最近创建统计
          recent_created: {
            today: stats.recentCreated.today,
            this_week: stats.recentCreated.thisWeek,
            this_month: stats.recentCreated.thisMonth
          },
          
          // 激活趋势（最近30天）
          activation_trend: stats.activationTrend,
          
          // 今日每小时激活统计
          hourly_activations: stats.hourlyActivations,
          
          // 系统健康指标
          health: {
            database_responsive: true,
            last_activation: totalActivations > 0 ? 'recent' : 'none',
            system_load: 'normal' // 可以根据实际情况计算
          }
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('获取详细统计数据失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '获取详细统计数据失败：' + error.message,
        data: {
          overview: {
            total_codes: 0,
            unused_codes: 0,
            used_codes: 0,
            expired_codes: 0,
            usage_rate: 0,
            active_rate: 0
          },
          devices: {
            unique_devices: 0,
            total_activations: 0,
            average_activations_per_device: 0
          },
          health: {
            database_responsive: false,
            last_activation: 'unknown',
            system_load: 'error'
          }
        }
      },
      { status: 500 }
    );
  }
}
