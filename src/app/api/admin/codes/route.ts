import { NextRequest, NextResponse } from 'next/server';
import { getActivationCodes, createActivationCodes } from '@/lib/db';
import { generateActivationCode, formatDateTimeForAPI } from '@/lib/utils';

// 使用工具函数生成激活码

/**
 * 获取激活码列表 API
 * GET /api/admin/codes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 验证参数
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { 
          success: false, 
          message: '分页参数无效' 
        },
        { status: 400 }
      );
    }

    // 获取激活码列表
    const result = await getActivationCodes({
      status: status === 'all' ? undefined : status,
      search: search || undefined,
      limit,
      offset
    });

    // 格式化日期字段
    const formattedCodes = result.codes.map(code => ({
      ...code,
      created_at: formatDateTimeForAPI(code.created_at),
      expires_at: formatDateTimeForAPI(code.expires_at),
      used_at: formatDateTimeForAPI(code.used_at)
    }));

    return NextResponse.json(
      {
        success: true,
        message: '获取激活码列表成功',
        data: {
          codes: formattedCodes,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('获取激活码列表API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '获取激活码列表失败'
      },
      { status: 500 }
    );
  }
}

/**
 * 批量生成激活码 API
 * POST /api/admin/codes
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { quantity, expires_at } = body;

    // 验证请求参数
    if (!quantity || quantity < 1 || quantity > 1000) {
      return NextResponse.json(
        { 
          success: false, 
          message: '生成数量必须在1-1000之间' 
        },
        { status: 400 }
      );
    }

    // 验证过期时间格式（如果提供）
    let expiresAt: Date | null = null;
    if (expires_at) {
      expiresAt = new Date(expires_at);
      if (isNaN(expiresAt.getTime())) {
        return NextResponse.json(
          { 
            success: false, 
            message: '过期时间格式无效' 
          },
          { status: 400 }
        );
      }
      
      // 检查过期时间不能是过去的时间
      if (expiresAt <= new Date()) {
        return NextResponse.json(
          { 
            success: false, 
            message: '过期时间不能是过去的时间' 
          },
          { status: 400 }
        );
      }
    }

    // 生成激活码
    const codes = [];
    const generatedCodes = new Set<string>(); // 确保不重复

    for (let i = 0; i < quantity; i++) {
      let code: string;
      let attempts = 0;
      
      // 生成唯一的激活码（最多尝试100次）
      do {
        code = generateActivationCode();
        attempts++;
      } while (generatedCodes.has(code) && attempts < 100);
      
      if (attempts >= 100) {
        return NextResponse.json(
          { 
            success: false, 
            message: '生成唯一激活码失败，请稍后重试' 
          },
          { status: 500 }
        );
      }
      
      generatedCodes.add(code);
      codes.push({
        code,
        expires_at: expiresAt
      });
    }

    // 保存到数据库
    const createdCodes = await createActivationCodes(codes);

    // 格式化日期字段
    const formattedCodes = createdCodes.map(code => ({
      ...code,
      created_at: formatDateTimeForAPI(code.created_at),
      expires_at: formatDateTimeForAPI(code.expires_at),
      used_at: formatDateTimeForAPI(code.used_at)
    }));

    return NextResponse.json(
      {
        success: true,
        message: `成功生成 ${createdCodes.length} 个激活码`,
        data: {
          codes: formattedCodes,
          summary: {
            generated: createdCodes.length,
            expires_at: formatDateTimeForAPI(expiresAt)
          }
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('生成激活码API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '生成激活码失败'
      },
      { status: 500 }
    );
  }
}


