import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * 批量操作激活码 API
 * POST /api/admin/codes/batch
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { action, ids } = body;

    // 验证请求参数
    if (!action || !ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { 
          success: false, 
          message: '缺少必要参数：action 和 ids' 
        },
        { status: 400 }
      );
    }

    // 验证操作类型
    const validActions = ['delete', 'reset'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          message: '无效的操作类型，支持的操作：delete, reset' 
        },
        { status: 400 }
      );
    }

    // 验证 IDs
    const validIds = ids.filter(id => Number.isInteger(id) && id > 0);
    if (validIds.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '没有有效的激活码ID' 
        },
        { status: 400 }
      );
    }

    let result;
    let message;

    switch (action) {
      case 'delete':
        // 批量删除激活码
        result = await query(
          `DELETE FROM activation_codes WHERE id = ANY($1::int[])`,
          [validIds]
        );
        message = `成功删除 ${result.rowCount} 个激活码`;
        break;

      case 'reset':
        // 批量重置激活码
        result = await query(
          `UPDATE activation_codes 
           SET status = 'unused', used_by_device_id = NULL, used_at = NULL 
           WHERE id = ANY($1::int[]) AND status = 'used'`,
          [validIds]
        );
        message = `成功重置 ${result.rowCount} 个激活码`;
        break;

      default:
        return NextResponse.json(
          { 
            success: false, 
            message: '不支持的操作类型' 
          },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        message,
        data: {
          action,
          processed: result.rowCount,
          requested: validIds.length
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('批量操作激活码API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '服务器内部错误，请稍后重试'
      },
      { status: 500 }
    );
  }
}


