import { NextRequest, NextResponse } from 'next/server';
import { resetActivationCode } from '@/lib/db';

/**
 * 重置激活码 API
 * POST /api/admin/codes/[id]/reset
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const codeId = parseInt(id);

    // 验证 ID 参数
    if (isNaN(codeId) || codeId < 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: '无效的激活码ID' 
        },
        { status: 400 }
      );
    }

    // 执行重置操作
    const success = await resetActivationCode(codeId);

    if (success) {
      return NextResponse.json(
        {
          success: true,
          message: '激活码重置成功',
          data: {
            id: codeId,
            reset_at: new Date().toISOString()
          }
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: '激活码不存在或重置失败'
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('重置激活码API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '重置激活码失败'
      },
      { status: 500 }
    );
  }
}
