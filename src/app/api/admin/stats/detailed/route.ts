import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * 获取详细统计数据 API
 * GET /api/admin/stats/detailed
 */
export async function GET() {
  try {
    // 获取基础统计数据
    const statsResult = await query('SELECT * FROM activation_codes_stats');
    const stats = statsResult.rows[0] || {
      total_codes: 0,
      unused_codes: 0,
      used_codes: 0,
      expired_codes: 0
    };

    // 获取每日激活趋势（最近30天）
    const trendResult = await query(`
      SELECT 
        DATE(used_at) as date,
        COUNT(*) as activations
      FROM activation_codes 
      WHERE used_at >= CURRENT_DATE - INTERVAL '30 days'
        AND used_at IS NOT NULL
      GROUP BY DATE(used_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // 获取设备统计
    const deviceResult = await query(`
      SELECT 
        COUNT(DISTINCT used_by_device_id) as unique_devices,
        COUNT(*) as total_activations
      FROM activation_codes 
      WHERE used_by_device_id IS NOT NULL
    `);

    // 获取过期情况统计
    const expiryResult = await query(`
      SELECT 
        COUNT(CASE WHEN expires_at IS NULL THEN 1 END) as never_expire,
        COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as valid,
        COUNT(CASE WHEN expires_at <= CURRENT_TIMESTAMP THEN 1 END) as expired
      FROM activation_codes
    `);

    // 获取最近创建的激活码统计
    const recentResult = await query(`
      SELECT 
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month
      FROM activation_codes
    `);

    // 获取每小时激活统计（今天）
    const hourlyResult = await query(`
      SELECT 
        EXTRACT(HOUR FROM used_at) as hour,
        COUNT(*) as activations
      FROM activation_codes 
      WHERE DATE(used_at) = CURRENT_DATE
        AND used_at IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM used_at)
      ORDER BY hour
    `);

    const deviceStats = deviceResult.rows[0] || { unique_devices: 0, total_activations: 0 };
    const expiryStats = expiryResult.rows[0] || { never_expire: 0, valid: 0, expired: 0 };
    const recentStats = recentResult.rows[0] || { today: 0, this_week: 0, this_month: 0 };

    // 计算使用率
    const totalCodes = parseInt(stats.total_codes) || 0;
    const usedCodes = parseInt(stats.used_codes) || 0;
    const usageRate = totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(1) : '0.0';

    // 计算设备重复使用率
    const uniqueDevices = parseInt(deviceStats.unique_devices) || 0;
    const totalActivations = parseInt(deviceStats.total_activations) || 0;
    const deviceReuseRate = uniqueDevices > 0 ? ((totalActivations / uniqueDevices)).toFixed(1) : '0.0';

    return NextResponse.json(
      {
        success: true,
        message: '获取详细统计数据成功',
        data: {
          // 基础统计
          overview: {
            total_codes: totalCodes,
            unused_codes: parseInt(stats.unused_codes) || 0,
            used_codes: usedCodes,
            expired_codes: parseInt(stats.expired_codes) || 0,
            usage_rate: parseFloat(usageRate),
            active_rate: totalCodes > 0 ? (((totalCodes - parseInt(stats.expired_codes)) / totalCodes) * 100).toFixed(1) : '0.0'
          },
          
          // 设备统计
          devices: {
            unique_devices: uniqueDevices,
            total_activations: totalActivations,
            average_activations_per_device: parseFloat(deviceReuseRate)
          },
          
          // 过期统计
          expiry: {
            never_expire: parseInt(expiryStats.never_expire) || 0,
            valid: parseInt(expiryStats.valid) || 0,
            expired: parseInt(expiryStats.expired) || 0
          },
          
          // 最近创建统计
          recent_created: {
            today: parseInt(recentStats.today) || 0,
            this_week: parseInt(recentStats.this_week) || 0,
            this_month: parseInt(recentStats.this_month) || 0
          },
          
          // 激活趋势（最近30天）
          activation_trend: trendResult.rows.map(row => ({
            date: row.date,
            activations: parseInt(row.activations)
          })).reverse(), // 按时间正序排列
          
          // 今日每小时激活统计
          hourly_activations: Array.from({ length: 24 }, (_, hour) => {
            const found = hourlyResult.rows.find(row => parseInt(row.hour) === hour);
            return {
              hour,
              activations: found ? parseInt(found.activations) : 0
            };
          }),
          
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
