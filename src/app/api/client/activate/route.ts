import { NextRequest, NextResponse } from 'next/server';
import { validateActivationCode } from '@/lib/db';
import { cleanActivationCode, isValidActivationCodeFormat, formatDateTimeForAPI } from '@/lib/utils';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { createLicenseToken, generateNonce, getKeyInfo } from '@/lib/signing';

/**
 * 处理预检请求
 * OPTIONS /api/client/activate
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, User-Agent',
      'Access-Control-Max-Age': '86400',
      'X-Sign-Alg': getKeyInfo().alg,
    },
  });
}

/**
 * 客户端激活码验证 API
 * POST /api/client/activate
 */
export async function POST(request: NextRequest) {
  try {
    // 1. API Key 认证检查
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.CLIENT_API_KEY;

    if (!expectedApiKey) {
      console.error('CLIENT_API_KEY 环境变量未配置');
      return NextResponse.json(
        {
          success: false,
          message: '服务配置错误'
        },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: '未授权访问，请提供有效的 API Key'
        },
        { status: 401 }
      );
    }

    // 2. 获取客户端信息用于频率限制
    const clientIP = getClientIP(request);

    // 解析请求体
    const body = await request.json();
    const { code, device_id } = body;

    // 3. 验证请求参数
    if (!code || !device_id) {
      return NextResponse.json(
        {
          success: false,
          message: '缺少必要参数：code 和 device_id'
        },
        { status: 400 }
      );
    }

    // 4. 频率限制检查
    // 检查基于 IP 的频率限制
    const ipRateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIGS.ACTIVATE_IP);
    if (ipRateLimit.limited) {
      console.log(`🚦 IP 频率限制触发: ${clientIP}, 剩余重置时间: ${Math.ceil(ipRateLimit.resetTimeMs / 1000)}s`);
      return NextResponse.json(
        {
          success: false,
          message: `请求过于频繁，请在 ${Math.ceil(ipRateLimit.resetTimeMs / 1000)} 秒后重试`,
          retryAfter: Math.ceil(ipRateLimit.resetTimeMs / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(ipRateLimit.resetTimeMs / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.ACTIVATE_IP.maxRequests.toString(),
            'X-RateLimit-Remaining': ipRateLimit.remaining.toString(),
            'X-RateLimit-Reset': ipRateLimit.resetTime.toString()
          }
        }
      );
    }

    // 检查基于设备 ID 的频率限制
    const deviceRateLimit = checkRateLimit(device_id, RATE_LIMIT_CONFIGS.ACTIVATE_DEVICE);
    if (deviceRateLimit.limited) {
      console.log(`📱 设备频率限制触发: ${device_id}, 剩余重置时间: ${Math.ceil(deviceRateLimit.resetTimeMs / 1000)}s`);
      return NextResponse.json(
        {
          success: false,
          message: `该设备请求过于频繁，请在 ${Math.ceil(deviceRateLimit.resetTimeMs / 60000)} 分钟后重试`,
          retryAfter: Math.ceil(deviceRateLimit.resetTimeMs / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(deviceRateLimit.resetTimeMs / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.ACTIVATE_DEVICE.maxRequests.toString(),
            'X-RateLimit-Remaining': deviceRateLimit.remaining.toString(),
            'X-RateLimit-Reset': deviceRateLimit.resetTime.toString()
          }
        }
      );
    }

    // 检查全局频率限制
    const globalRateLimit = checkRateLimit('global', RATE_LIMIT_CONFIGS.ACTIVATE_GLOBAL);
    if (globalRateLimit.limited) {
      return NextResponse.json(
        {
          success: false,
          message: '系统繁忙，请稍后重试',
          retryAfter: Math.ceil(globalRateLimit.resetTimeMs / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(globalRateLimit.resetTimeMs / 1000).toString()
          }
        }
      );
    }

    // 5. 清理和验证激活码格式
    const cleanCode = cleanActivationCode(code);
    if (!isValidActivationCodeFormat(cleanCode)) {
      return NextResponse.json(
        {
          success: false,
          message: '激活码格式不正确'
        },
        { status: 400 }
      );
    }

    // 6. 验证设备ID格式（基本验证）
    if (device_id.length < 3 || device_id.length > 255) {
      return NextResponse.json(
        {
          success: false,
          message: '设备标识格式不正确'
        },
        { status: 400 }
      );
    }

    // 7. 执行激活码验证（使用清理后的激活码）
    const result = await validateActivationCode(cleanCode, device_id);

    if (result.success) {
      // 激活成功
      console.log(`✅ 激活成功: ${cleanCode} -> ${device_id} (IP: ${clientIP})`);
      const nonce = generateNonce();
      const ts = Date.now();
      const algInfo = getKeyInfo();
      const licenseClaims = {
        route: '/api/client/activate',
        device_id,
        code: result.activationCode?.code,
        is_activated: true,
        activated_at: formatDateTimeForAPI(new Date()),
        expires_at: formatDateTimeForAPI(result.activationCode?.expires_at || null),
        nonce,
        ts
      };
      const licenseToken = await createLicenseToken(licenseClaims);
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: {
            code: result.activationCode?.code,
            device_id: device_id,
            activated_at: formatDateTimeForAPI(new Date()),
            expires_at: formatDateTimeForAPI(result.activationCode?.expires_at || null),
            license_token: licenseToken,
            nonce,
            ts,
            alg: algInfo.alg
          }
        },
        {
          status: 200,
          headers: {
            'X-RateLimit-IP-Remaining': ipRateLimit.remaining.toString(),
            'X-RateLimit-Device-Remaining': deviceRateLimit.remaining.toString(),
            'X-License-Alg': algInfo.alg
          }
        }
      );
    } else {
      // 激活失败 - 统一错误响应，避免信息泄露
      console.log(`❌ 激活失败: ${cleanCode} -> ${device_id} (IP: ${clientIP}) - ${result.message}`);
      return NextResponse.json(
        {
          success: false,
          message: '激活码无效或已被使用'
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('激活码验证API错误:', {
      error: error.message,
      stack: error.stack,
      timestamp: formatDateTimeForAPI(new Date())
    });

    // 避免泄露内部错误信息
    return NextResponse.json(
      {
        success: false,
        message: '服务暂时不可用，请稍后重试'
      },
      { status: 500 }
    );
  }
}


