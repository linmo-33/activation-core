import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, id } = body;

    let deleteCount = 0;
    if (Array.isArray(ids) && ids.length > 0) {
      // 批量删除
      const result = await prisma.activationLog.deleteMany({
        where: { id: { in: ids } }
      });
      deleteCount = result.count;
    } else if (typeof id === 'number') {
      // 单条删除
      const result = await prisma.activationLog.delete({ where: { id } });
      deleteCount = result ? 1 : 0;
    } else {
      return createErrorResponse('请提供要删除的日志ID或ID数组', 400);
    }

    return createSuccessResponse({ deleteCount }, `成功删除${deleteCount}条日志`);
  } catch (error) {
    console.error('删除日志时发生错误:', error);
    return createErrorResponse('服务器内部错误', 500);
  }
} 