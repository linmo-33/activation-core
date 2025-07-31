#!/usr/bin/env node

/**
 * 密码哈希生成工具
 * 用于生成管理员密码的 bcrypt 哈希值
 * 
 * 使用方法:
 * node scripts/hash-password.js [password]
 * 
 * 如果不提供密码参数，将提示输入密码
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

async function hashPassword(password) {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (error) {
    console.error('密码哈希生成失败:', error);
    process.exit(1);
  }
}

async function getPasswordInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('请输入要哈希的密码: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

async function main() {
  let password = process.argv[2] || 'admin123';

  console.log('正在生成密码哈希...');
  const hash = await hashPassword(password);

  console.log('\n=== 密码哈希生成成功 ===');
  console.log('原密码:', password);
  console.log('哈希值:', hash);
  console.log('\n=== SQL 更新语句 ===');
  console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE username = 'admin';`);
  console.log('\n=== 数据库初始化语句 ===');
  console.log(`INSERT INTO admin_users (username, password_hash) VALUES ('admin', '${hash}') ON CONFLICT (username) DO UPDATE SET password_hash = '${hash}';`);
}

// 运行主函数
main().catch(console.error);
