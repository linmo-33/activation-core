import { NextRequest, NextResponse } from 'next/server';
import { checkDeviceActivationStatus } from '@/server/activation';
import { formatDateTimeForAPI } from '@/lib/utils';
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { createLicenseToken, generateNonce, getKeyInfo } from '@/lib/signing';

/**
 * 处理预检请求
 * OPTIONS /api/client/verify
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
 * 客户端设备激活状态验证 API
 * POST /api/client/verify
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
    const { device_id } = body;

    // 3. 验证请求参数
    if (!device_id) {
      return NextResponse.json(
        {
          success: false,
          message: '缺少必要参数：device_id'
        },
        { status: 400 }
      );
    }

    // 4. 验证设备ID格式（基本验证）
    if (device_id.length < 3 || device_id.length > 255) {
      return NextResponse.json(
        {
          success: false,
          message: '设备标识格式不正确'
        },
        { status: 400 }
      );
    }

    // 5. 频率限制检查
    // 检查基于 IP 的频率限制
    const ipRateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIGS.VERIFY_IP);
    if (ipRateLimit.limited) {
      console.log(`🚦 验证 IP 频率限制触发: ${clientIP}, 剩余重置时间: ${Math.ceil(ipRateLimit.resetTimeMs / 1000)}s`);
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
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.VERIFY_IP.maxRequests.toString(),
            'X-RateLimit-Remaining': ipRateLimit.remaining.toString(),
            'X-RateLimit-Reset': ipRateLimit.resetTime.toString()
          }
        }
      );
    }

    // 检查基于设备 ID 的频率限制
    const deviceRateLimit = checkRateLimit(device_id, RATE_LIMIT_CONFIGS.VERIFY_DEVICE);
    if (deviceRateLimit.limited) {
      console.log(`🚦 验证设备频率限制触发: ${device_id}, 剩余重置时间: ${Math.ceil(deviceRateLimit.resetTimeMs / 1000)}s`);
      return NextResponse.json(
        {
          success: false,
          message: `该设备请求过于频繁，请在 ${Math.ceil(deviceRateLimit.resetTimeMs / 1000)} 秒后重试`,
          retryAfter: Math.ceil(deviceRateLimit.resetTimeMs / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(deviceRateLimit.resetTimeMs / 1000).toString(),
            'X-RateLimit-Device-Remaining': deviceRateLimit.remaining.toString()
          }
        }
      );
    }

    // 检查全局频率限制
    const globalRateLimit = checkRateLimit('global', RATE_LIMIT_CONFIGS.VERIFY_GLOBAL);
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

    // 6. 查询设备激活状态
    const activationStatus = await checkDeviceActivationStatus(device_id);

    // 7. 构建响应数据
    let responseData: any = {
      device_id: device_id,
      is_activated: activationStatus.isActivated,
      verified_at: formatDateTimeForAPI(new Date())
    };

    if (activationStatus.isActivated && activationStatus.activationCode) {
      // 设备已激活，返回激活信息（不包含敏感的激活码）
      responseData = {
        ...responseData,
        activation_info: {
          activated_at: formatDateTimeForAPI(activationStatus.activationCode.used_at),
          expires_at: formatDateTimeForAPI(activationStatus.activationCode.expires_at),
          is_permanent: activationStatus.activationCode.expires_at === null
        }
      };

      console.log(`✅ 设备验证成功: ${device_id} 激活状态有效 (IP: ${clientIP})`);

      // 仅在激活有效时提供签名令牌
      const nonce = generateNonce();
      const ts = Date.now();
      const algInfo = getKeyInfo();
      const licenseClaims = {
        route: '/api/client/verify',
        device_id,
        is_activated: true,
        activated_at: responseData.activation_info.activated_at,
        expires_at: responseData.activation_info.expires_at,
        nonce,
        ts
      };
      const licenseToken = await createLicenseToken(licenseClaims);
      responseData.license_token = licenseToken;
      responseData.nonce = nonce;
      responseData.ts = ts;
      responseData.alg = algInfo.alg;
    } else {
      // 设备未激活或激活已过期
      if (activationStatus.hasExpiredActivations) {
        responseData.expired_activations = true;
      }

      console.log(`❌ 设备验证: ${device_id} 未激活或已过期 (IP: ${clientIP})`);
    }

    return NextResponse.json(
      {
        success: true,
        message: activationStatus.isActivated ? '设备激活状态有效' : '设备未激活或激活已过期',
        data: responseData
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-IP-Remaining': ipRateLimit.remaining.toString(),
          'X-RateLimit-Device-Remaining': deviceRateLimit.remaining.toString()
        }
      }
    );

  } catch (error: any) {
    console.error('设备激活状态验证失败:', error);

    return NextResponse.json(
      {
        success: false,
        message: '验证失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}
