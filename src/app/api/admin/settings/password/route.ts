import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * 修改管理员密码 API
 * POST /api/admin/settings/password
 */
export async function POST(request: NextRequest) {
  try {
    // 中间件已经验证了 JWT，我们需要从 token 中获取管理员 ID
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    // 解码 token 获取管理员 ID（不需要验证签名，中间件已经验证过）
    let adminId: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      adminId = payload.id;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Token 格式无效' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // 验证请求参数
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: '缺少必要参数：currentPassword 和 newPassword' 
        },
        { status: 400 }
      );
    }

    // 验证新密码强度
    if (newPassword.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          message: '新密码长度至少为6个字符' 
        },
        { status: 400 }
      );
    }

    // 获取当前管理员信息
    const adminResult = await query(
      'SELECT id, username, password_hash FROM admin_users WHERE id = $1',
      [adminId]
    );

    if (adminResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '管理员账户不存在' },
        { status: 404 }
      );
    }

    const admin = adminResult.rows[0];

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: '当前密码不正确' },
        { status: 400 }
      );
    }

    // 生成新密码哈希
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    const updateResult = await query(
      'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, adminId]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: '密码更新失败' },
        { status: 500 }
      );
    }

    // 记录操作日志（可选）
    console.log(`管理员 ${admin.username} 修改了密码`);

    return NextResponse.json(
      {
        success: true,
        message: '密码修改成功',
        data: {
          username: admin.username,
          updated_at: new Date().toISOString()
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('修改密码API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '服务器内部错误，请稍后重试'
      },
      { status: 500 }
    );
  }
}


