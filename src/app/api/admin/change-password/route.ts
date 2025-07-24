import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyPassword, hashPassword, verifyJWT } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return createErrorResponse('未登录', 401)
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return createErrorResponse('无效的认证信息', 401)
    }

    const body = await request.json()
    const { oldPassword, newPassword } = body

    // 验证请求参数
    if (!oldPassword || typeof oldPassword !== 'string') {
      return createErrorResponse('请输入当前密码', 400)
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return createErrorResponse('请输入新密码', 400)
    }

    // 密码强度验证
    if (newPassword.length < 6) {
      return createErrorResponse('新密码长度至少6位', 400)
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      return createErrorResponse('新密码需包含字母和数字', 400)
    }

    // 查找管理员账户
    const admin = await prisma.admin.findUnique({
      where: { username: payload.username as string }
    })

    if (!admin) {
      return createErrorResponse('用户不存在', 404)
    }

    // 验证当前密码
    const isOldPasswordValid = await verifyPassword(oldPassword, admin.password)
    if (!isOldPasswordValid) {
      return createErrorResponse('当前密码错误', 400)
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await verifyPassword(newPassword, admin.password)
    if (isSamePassword) {
      return createErrorResponse('新密码不能与当前密码相同', 400)
    }

    // 更新密码
    const hashedNewPassword = await hashPassword(newPassword)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedNewPassword }
    })

    return createSuccessResponse({}, '密码修改成功')

  } catch (error) {
    console.error('修改密码时发生错误:', error)
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