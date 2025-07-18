#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    console.log('🔑 重置管理员密码...')

    // 获取新密码（从环境变量或命令行参数）
    const newPassword = process.env.ADMIN_PASSWORD || process.argv[2]
    
    if (!newPassword) {
      console.error('❌ 请提供新密码：')
      console.error('   方法1: ADMIN_PASSWORD=newpassword npm run reset-password')
      console.error('   方法2: npm run reset-password newpassword')
      process.exit(1)
    }

    // 查找管理员账户
    const admin = await prisma.admin.findFirst()
    if (!admin) {
      console.error('❌ 管理员账户不存在，请先运行 npm run init:admin')
      process.exit(1)
    }

    // 更新密码
    const hashedPassword = await hashPassword(newPassword)
    
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    })

    console.log('✅ 管理员密码重置成功！')
    console.log(`📋 用户名: ${admin.username}`)
    console.log(`🔑 新密码: ${newPassword}`)
    console.log('')
    console.log('⚠️  请妥善保存新密码信息')

  } catch (error) {
    console.error('❌ 密码重置失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword().catch(console.error) 