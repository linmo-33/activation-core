import { NextRequest, NextResponse } from 'next/server';
import { getDeviceActivationHistory, checkDeviceActivationStatus, resetDeviceValidActivations } from '@/server/activation';
import { formatDateTimeForAPI } from '@/lib/utils';

/**
 * 查询设备激活状态和历史 API
 * GET /api/admin/devices/[deviceId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId: rawDeviceId } = await params;
    const deviceId = decodeURIComponent(rawDeviceId);

    // 验证设备ID参数
    if (!deviceId || deviceId.length < 3) {
      return NextResponse.json(
        { 
          success: false, 
          message: '无效的设备ID' 
        },
        { status: 400 }
      );
    }

    // 获取设备激活状态
    const activationStatus = await checkDeviceActivationStatus(deviceId);

    // 获取设备激活历史
    const activationHistory = await getDeviceActivationHistory(deviceId);

    // 格式化当前激活码的日期
    const formattedCurrentActivation = activationStatus.activationCode ? {
      ...activationStatus.activationCode,
      created_at: formatDateTimeForAPI(activationStatus.activationCode.created_at),
      expires_at: formatDateTimeForAPI(activationStatus.activationCode.expires_at),
      used_at: formatDateTimeForAPI(activationStatus.activationCode.used_at)
    } : null;

    // 格式化激活历史的日期
    const formattedHistory = activationHistory.map(activation => ({
      ...activation,
      created_at: formatDateTimeForAPI(activation.created_at),
      expires_at: formatDateTimeForAPI(activation.expires_at),
      used_at: formatDateTimeForAPI(activation.used_at)
    }));

    return NextResponse.json(
      {
        success: true,
        message: '查询成功',
        data: {
          device_id: deviceId,
          is_activated: activationStatus.isActivated,
          has_expired_activations: activationStatus.hasExpiredActivations,
          current_activation: formattedCurrentActivation,
          activation_history: formattedHistory,
          total_activations: activationHistory.length
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('查询设备激活状态失败:', error);

    return NextResponse.json(
      {
        success: false,
        message: '查询失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 重置设备激活状态 API
 * DELETE /api/admin/devices/[deviceId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId: rawDeviceId } = await params;
    const deviceId = decodeURIComponent(rawDeviceId);

    // 验证设备ID参数
    if (!deviceId || deviceId.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的设备ID'
        },
        { status: 400 }
      );
    }

    // 获取管理员信息（从中间件设置的请求头中）
    const adminId = request.headers.get('x-admin-id');
    const adminUsername = request.headers.get('x-admin-username');

    // 只重置该设备有效期内的激活码，保留历史记录
    const resetCount = await resetDeviceValidActivations(deviceId);

    // 记录管理员操作日志
    console.log(`🔧 管理员重置设备: ${adminUsername}(${adminId}) 重置设备 ${deviceId}, 释放 ${resetCount} 个有效激活码`);

    return NextResponse.json(
      {
        success: true,
        message: resetCount > 0
          ? `成功重置设备激活状态，释放了 ${resetCount} 个有效激活码`
          : '设备没有有效的激活码需要重置',
        data: {
          device_id: deviceId,
          reset_codes_count: resetCount,
          reset_type: 'valid_only',
          reset_by: adminUsername,
          reset_at: formatDateTimeForAPI(new Date())
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('重置设备激活状态失败:', error);

    return NextResponse.json(
      {
        success: false,
        message: '重置失败'
      },
      { status: 500 }
    );
  }
}
