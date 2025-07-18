import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

type WhereInput = {
  code?: {
    contains: string
  }
  isUsed?: boolean
  expiresAt?: {
    lte?: Date
    gt?: Date
  } | null
  OR?: Array<{
    expiresAt?: {
      gt?: Date
    } | null
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, search, status } = body;
    let codes: { code: string }[] = [];

    if (Array.isArray(ids) && ids.length > 0) {
      // 按ID导出
      codes = await prisma.activationCode.findMany({
        where: { id: { in: ids } },
        select: { code: true }
      });
    } else {
      // 按筛选条件导出
      const where: WhereInput = {};
      if (search) {
        where.code = { contains: search.toUpperCase() };
      }
      if (status === 'used') {
        where.isUsed = true;
      } else if (status === 'unused') {
        where.isUsed = false;
      }
      codes = await prisma.activationCode.findMany({
        where,
        select: { code: true }
      });
    }
    const codeList = codes.map(c => c.code).join('\n');
    return createSuccessResponse({ codeList, count: codes.length }, `成功导出${codes.length}个激活码`);
  } catch (error) {
    console.error('导出激活码时发生错误:', error);
    return createErrorResponse('服务器内部错误', 500);
  }
} 