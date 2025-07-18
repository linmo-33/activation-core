#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function initAdmin() {
  try {
    console.log('🚀 开始初始化管理员账户...')

    // 检查是否已存在管理员
    const existingAdmin = await prisma.admin.findFirst()
    if (existingAdmin) {
      console.log('⚠️  管理员账户已存在，无需重复创建')
      return
    }

    // 从环境变量获取管理员信息，或使用默认值
    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || generateRandomPassword()

    // 创建管理员账户
    const hashedPassword = await hashPassword(password)
    
    await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
      }
    })

    console.log('✅ 管理员账户创建成功！')
    console.log('📋 账户信息：')
    console.log(`   用户名: ${username}`)
    console.log(`   密码: ${password}`)
    console.log('')
    console.log('⚠️  请妥善保存以上信息，并建议首次登录后修改密码')

  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}

// 执行初始化
initAdmin().catch(console.error) 