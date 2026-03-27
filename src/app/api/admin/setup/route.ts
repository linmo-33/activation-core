import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createInitialAdmin, isAdminSystemInitialized } from '@/server/admin';
import {
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  getClearedAdminSessionCookieOptions
} from '@/lib/admin-auth';

const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * 首次初始化管理员接口
 * POST /api/admin/setup
 */
export async function POST(request: NextRequest) {
  try {
    const isInitialized = await isAdminSystemInitialized();
    if (isInitialized) {
      return NextResponse.json(
        {
          success: false,
          message: '系统已完成初始化，请直接登录'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, confirmPassword } = body;

    if (!username || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: '用户名、密码和确认密码不能为空'
        },
        { status: 400 }
      );
    }

    if (typeof username !== 'string' || username.length < 3 || username.length > 32) {
      return NextResponse.json(
        {
          success: false,
          message: '用户名长度必须在 3-32 个字符之间'
        },
        { status: 400 }
      );
    }

    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        {
          success: false,
          message: '用户名只能包含字母、数字、下划线和短横线'
        },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: '密码长度不能少于 6 个字符'
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: '两次输入的密码不一致'
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let admin;
    try {
      admin = await createInitialAdmin(username, passwordHash);
    } catch (error) {
      if (error instanceof Error && error.message === 'ADMIN_ALREADY_INITIALIZED') {
        return NextResponse.json(
          {
            success: false,
            message: '系统已完成初始化，请直接登录'
          },
          { status: 403 }
        );
      }
      throw error;
    }

    const token = await createAdminSessionToken({
      id: admin.id,
      username: admin.username
    });

    const response = NextResponse.json(
      {
        success: true,
        message: '初始化成功',
        data: {
          user: {
            id: admin.id,
            username: admin.username,
            role: 'admin'
          }
        }
      },
      { status: 201 }
    );

    response.cookies.set('token', token, getAdminSessionCookieOptions());
    response.cookies.set('admin_token', '', getClearedAdminSessionCookieOptions());

    return response;
  } catch (error) {
    console.error('管理员初始化API错误:', error);

    return NextResponse.json(
      {
        success: false,
        message: '初始化失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}
