import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getAdminByUsername } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const JWT_EXPIRES_IN = '24h';

/**
 * 管理员登录 API
 * POST /api/admin/login
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { username, password } = body;

    // 验证请求参数
    if (!username || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名和密码不能为空' 
        },
        { status: 400 }
      );
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名长度必须在3-50个字符之间' 
        },
        { status: 400 }
      );
    }

    // 验证密码格式
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          message: '密码长度不能少于6个字符' 
        },
        { status: 400 }
      );
    }

    // 查询管理员用户
    const admin = await getAdminByUsername(username);

    if (!admin) {
      // 为了安全，不透露具体是用户名错误还是密码错误
      return NextResponse.json(
        {
          success: false,
          message: '用户名或密码错误'
        },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: '用户名或密码错误'
        },
        { status: 401 }
      );
    }

    // 生成 JWT Token
    const token = await new SignJWT({
      id: admin.id,
      username: admin.username,
      role: 'admin'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // 创建响应
    const response = NextResponse.json(
      {
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: admin.id,
            username: admin.username
          },
          token: token,
          expires_in: JWT_EXPIRES_IN
        }
      },
      { status: 200 }
    );

    // 设置新的 HttpOnly Cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false, // 开发环境设置为 false
      sameSite: 'lax', // 改为 lax 以避免跨站问题
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      path: '/'
    });

    // 清除旧的 admin_token cookie（向后兼容）
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });


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

    // 清除新的 token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    // 清除旧的 admin_token cookie（向后兼容）
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

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
