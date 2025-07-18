import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'


// 记录激活日志
async function logActivation(
  activationCodeId: number | null,
  activationCode: string,
  machineId: string,
  ipAddress: string | null,
  userAgent: string | null,
  isSuccess: boolean,
  errorMessage?: string
) {
  try {
    await prisma.activationLog.create({
      data: {
        activationCodeId,
        activationCode,
        machineId,
        ipAddress,
        userAgent,
        isSuccess,
        errorMessage: errorMessage || null,
      }
    })
  } catch (error) {
    console.error('记录激活日志失败:', error)
    // 不影响主流程，仅记录错误
  }
}

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json()
    const { code, machine_id, client_ip, user_agent } = body

    // 验证请求参数
    if (!code || typeof code !== 'string') {
      return createErrorResponse('激活码不能为空', 400)
    }

    if (!machine_id || typeof machine_id !== 'string') {
      return createErrorResponse('机器标识不能为空', 400)
    }

    const clientIP = client_ip || null
    const userAgent = user_agent || null

    // 查找激活码
    const activationCode = await prisma.activationCode.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        code: true,
        isUsed: true,
        usedAt: true,
        usedBy: true,
        usedIp: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        isDisabled: true
      }
    })

    if (!activationCode) {
      // 记录失败日志
      await logActivation(
        null, // 无效激活码ID
        code,
        machine_id,
        clientIP,
        userAgent,
        false,
        '激活码不存在'
      )
      return createErrorResponse('激活码不存在', 404)
    }

    // 检查激活码是否被禁用
    if (activationCode.isDisabled) {
      await logActivation(
        activationCode.id,
        code,
        machine_id,
        clientIP,
        userAgent,
        false,
        '激活码已被禁用'
      )
      return createErrorResponse('激活码已被禁用', 400)
    }

    // 检查激活码是否过期
    if (activationCode.expiresAt && new Date() > activationCode.expiresAt) {
      await logActivation(
        activationCode.id,
        code,
        machine_id,
        clientIP,
        userAgent,
        false,
        '激活码已过期'
      )
      return createErrorResponse('激活码已过期', 400)
    }

    // 检查激活码使用状态
    if (activationCode.isUsed) {
      // 如果已被使用，检查是否为同一机器
      if (activationCode.usedBy === machine_id) {
        // 同一机器重复校验，允许通过
        await logActivation(
          activationCode.id,
          code,
          machine_id,
          clientIP,
          userAgent,
          true
        )
        return createSuccessResponse(
          {
            expires_at: activationCode.expiresAt?.toISOString() || null,
            used_at: activationCode.usedAt?.toISOString() || null,
          },
          '激活码验证成功'
        )
      } else {
        await logActivation(
          activationCode.id,
          code,
          machine_id,
          clientIP,
          userAgent,
          false,
          '激活码已被其他机器使用'
        )
        return createErrorResponse('激活码已被其他机器使用', 400)
      }
    }

    // 首次使用，更新激活码状态
    const updatedCode = await prisma.activationCode.update({
      where: { id: activationCode.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy: machine_id,
        usedIp: clientIP,
        userAgent: userAgent,
      }
    })

    // 记录首次激活成功日志
    await logActivation(
      updatedCode.id,
      code,
      machine_id,
      clientIP,
      userAgent,
      true
    )

    return createSuccessResponse(
      { 
        expires_at: updatedCode.expiresAt?.toISOString() || null,
        used_at: updatedCode.usedAt?.toISOString() || null,
      },
      '激活码验证成功'
    )

  } catch (error) {
    console.error('验证激活码时发生错误:', error)
    
    // 尝试记录系统错误日志
    try {
      const body = await request.json()
      const { machine_id, client_ip, user_agent } = body
      if (machine_id) {
        await logActivation(
          null,
          '', // 激活码
          machine_id,
          client_ip || null,
          user_agent || null,
          false,
          '服务器内部错误'
        )
      }
    } catch (logError) {
      console.error('记录错误日志失败:', logError)
    }
    
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