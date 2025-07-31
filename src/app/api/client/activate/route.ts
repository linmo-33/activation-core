import { NextRequest, NextResponse } from 'next/server';
import { validateActivationCode } from '@/lib/db';
import { cleanActivationCode, isValidActivationCodeFormat } from '@/lib/utils';

/**
 * 客户端激活码验证 API
 * POST /api/client/activate
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { code, device_id } = body;

    // 验证请求参数
    if (!code || !device_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: '缺少必要参数：code 和 device_id' 
        },
        { status: 400 }
      );
    }

    // 清理和验证激活码格式
    const cleanCode = cleanActivationCode(code);
    if (!isValidActivationCodeFormat(cleanCode)) {
      return NextResponse.json(
        {
          success: false,
          message: '激活码格式不正确，应为20位字母数字组合'
        },
        { status: 400 }
      );
    }

    // 验证设备ID格式（可选）
    if (device_id.length < 3 || device_id.length > 255) {
      return NextResponse.json(
        { 
          success: false, 
          message: '设备ID格式不正确' 
        },
        { status: 400 }
      );
    }

    // 执行激活码验证（使用清理后的激活码）
    const result = await validateActivationCode(cleanCode, device_id);

    if (result.success) {
      // 激活成功
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: {
            code: result.activationCode?.code,
            device_id: device_id,
            activated_at: new Date().toISOString(),
            expires_at: result.activationCode?.expires_at
          }
        },
        { status: 200 }
      );
    } else {
      // 激活失败
      return NextResponse.json(
        {
          success: false,
          message: result.message
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('激活码验证API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '服务器内部错误，请稍后重试'
      },
      { status: 500 }
    );
  }
}


