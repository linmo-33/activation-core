import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import {
  clearAdminLoginFailures,
  getAdminByUsername,
  getAdminLoginGuardStatus,
  isAdminSystemInitialized,
  recordAdminLoginFailure
} from '@/server/admin';
import {
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  getClearedAdminSessionCookieOptions
} from '@/lib/admin-auth';
import { getClientIP } from '@/lib/rate-limit';

// 安全检查：确保 JWT_SECRET 已设置
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
  throw new Error('🔒 安全错误: JWT_SECRET 环境变量未设置或使用默认值，请设置强随机密钥');
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_EXPIRES_IN = '24h';

/**
 * 管理员登录 API
 * POST /api/admin/login
 */
export async function POST(request: NextRequest) {
  try {
    const isInitialized = await isAdminSystemInitialized();
    if (!isInitialized) {
      return NextResponse.json(
        {
          success: false,
          message: '系统尚未初始化，请先完成首次设置'
        },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const rawUsername = typeof body.username === 'string' ? body.username.trim() : '';
    const rawPassword = typeof body.password === 'string' ? body.password : '';
    const clientIP = getClientIP(request);

    // 验证请求参数
    if (!rawUsername || !rawPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名和密码不能为空' 
        },
        { status: 400 }
      );
    }

    // 验证用户名格式
    if (rawUsername.length < 3 || rawUsername.length > 50) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名长度必须在3-50个字符之间' 
        },
        { status: 400 }
      );
    }

    // 验证密码格式
    if (rawPassword.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          message: '密码长度不能少于6个字符' 
        },
        { status: 400 }
      );
    }

    const guardStatus = await getAdminLoginGuardStatus(rawUsername, clientIP);
    if (guardStatus.blocked) {
      return NextResponse.json(
        {
          success: false,
          message: `登录失败次数过多，请在 ${Math.ceil(guardStatus.retryAfterSeconds / 60)} 分钟后重试`,
          retryAfter: guardStatus.retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': guardStatus.retryAfterSeconds.toString()
          }
        }
      );
    }

    // 查询管理员用户
    const admin = await getAdminByUsername(rawUsername);

    if (!admin) {
      const failureStatus = await recordAdminLoginFailure(rawUsername, clientIP);
      // 为了安全，不透露具体是用户名错误还是密码错误
      return NextResponse.json(
        {
          success: false,
          message: failureStatus.blocked
            ? `登录失败次数过多，请在 ${Math.ceil(failureStatus.retryAfterSeconds / 60)} 分钟后重试`
            : '用户名或密码错误',
          ...(failureStatus.blocked ? { retryAfter: failureStatus.retryAfterSeconds } : {})
        },
        {
          status: failureStatus.blocked ? 429 : 401,
          headers: failureStatus.blocked
            ? { 'Retry-After': failureStatus.retryAfterSeconds.toString() }
            : undefined
        }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(rawPassword, admin.password_hash);
    if (!isPasswordValid) {
      const failureStatus = await recordAdminLoginFailure(rawUsername, clientIP);
      return NextResponse.json(
        {
          success: false,
          message: failureStatus.blocked
            ? `登录失败次数过多，请在 ${Math.ceil(failureStatus.retryAfterSeconds / 60)} 分钟后重试`
            : '用户名或密码错误',
          ...(failureStatus.blocked ? { retryAfter: failureStatus.retryAfterSeconds } : {})
        },
        {
          status: failureStatus.blocked ? 429 : 401,
          headers: failureStatus.blocked
            ? { 'Retry-After': failureStatus.retryAfterSeconds.toString() }
            : undefined
        }
      );
    }

    await clearAdminLoginFailures(rawUsername, clientIP);

    // 生成 JWT Token
    const token = await createAdminSessionToken({
      id: admin.id,
      username: admin.username
    });

    // 创建响应
    const response = NextResponse.json(
      {
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: admin.id,
            username: admin.username,
            role: 'admin'
          },
          expires_in: JWT_EXPIRES_IN
        }
      },
      { status: 200 }
    );

    // 设置新的 HttpOnly Cookie - 根据环境动态配置安全属性
    response.cookies.set('token', token, getAdminSessionCookieOptions());

    // 清除旧的 admin_token cookie（向后兼容）
    response.cookies.set('admin_token', '', getClearedAdminSessionCookieOptions());


    return response;

  } catch (error) {
    console.error('管理员登录API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '服务器内部错误，请稍后重试'
      },
      { status: 500 }
    );
  }
}

/**
 * 管理员登出 API
 * DELETE /api/admin/login
 */
export async function DELETE() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: '登出成功'
      },
      { status: 200 }
    );

    // 清除新的 token cookie - 使用与设置时相同的安全属性
    response.cookies.set('token', '', getClearedAdminSessionCookieOptions());

    // 清除旧的 admin_token cookie（向后兼容）
    response.cookies.set('admin_token', '', getClearedAdminSessionCookieOptions());

    return response;

  } catch (error) {
    console.error('管理员登出API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '登出失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 验证管理员登录状态 API
 * GET /api/admin/login
 */
export async function GET(request: NextRequest) {
  try {
    // 从 Cookie 中获取 token
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: '未登录'
        },
        { status: 401 }
      );
    }

    // 验证 JWT Token
    const { payload: decoded } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json(
      {
        success: true,
        message: '已登录',
        data: {
          user: {
            id: decoded.id,
            username: decoded.username,
            role: 'admin' // 硬编码，因为这是管理员系统
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('验证登录状态错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Token无效或已过期'
      },
      { status: 401 }
    );
  }
}
