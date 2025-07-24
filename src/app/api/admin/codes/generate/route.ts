import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateActivationCode } from '@/lib/utils'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, expiryDays } = body

    // 验证请求参数
    if (!amount || typeof amount !== 'number' || amount < 1 || amount > 100) {
      return createErrorResponse('生成数量必须是1-100之间的数字', 400)
    }

    if (expiryDays !== undefined && (typeof expiryDays !== 'number' || expiryDays < 1)) {
      return createErrorResponse('有效期天数必须是大于0的数字', 400)
    }

    // 计算过期时间
    let expiresAt: Date | undefined
    if (expiryDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)
    }

    const generatedCodes: string[] = []
    const maxRetries = 10 // 每个激活码最大重试次数

    for (let i = 0; i < amount; i++) {
      let code: string
      let retryCount = 0
      
      // 确保生成的激活码唯一
      do {
        code = generateActivationCode(16)
        retryCount++
        
        if (retryCount > maxRetries) {
          return createErrorResponse('生成激活码时遇到太多重复，请稍后重试', 500)
        }
        
        // 检查数据库中是否已存在该激活码
        const existingCode = await prisma.activationCode.findUnique({
          where: { code }
        })
        
        if (!existingCode) {
          break // 激活码唯一，跳出循环
        }
      } while (true)

      generatedCodes.push(code)
    }

    // 批量插入数据库
    const createData = generatedCodes.map(code => ({
      code,
      expiresAt,
      isDisabled: false
    }))

    await prisma.activationCode.createMany({
      data: createData
    })

    return createSuccessResponse(
      { 
        codes: generatedCodes,
        amount: generatedCodes.length,
        expiresAt: expiresAt?.toISOString() || null
      },
      `成功生成 ${generatedCodes.length} 个激活码`
    )

  } catch (error) {
    console.error('生成激活码时发生错误:', error)
    return createErrorResponse('服务器内部错误', 500)
  }
}

// 仅允许POST方法
export async function GET() {
  return createErrorResponse('方法不被允许', 405)
}

export async function PUT() {
  return createErrorResponse('方法不被允许', 405)
}

export async function DELETE() {
  return createErrorResponse('方法不被允许', 405)
} 