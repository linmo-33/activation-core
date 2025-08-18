#!/usr/bin/env node
/**
 * ES256 密钥对生成脚本
 * 用于快速生成激活码管理系统所需的所有密钥
 */

const crypto = require('crypto');
const { generateKeyPairSync } = require('crypto');

console.log('🔑 激活码管理系统 - 密钥生成工具');
console.log('=====================================\n');

try {
    // 生成 ES256 密钥对
    console.log('正在生成 ES256 密钥对 (P-256)...');
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' }
    });

    // 生成其他随机密钥
    console.log('正在生成随机密钥...\n');
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const clientApiKey = crypto.randomBytes(32).toString('hex');

    // 输出环境变量格式
    console.log('✅ 密钥生成完成！\n');
    console.log('=== 复制以下内容到 Vercel 环境变量 ===');
    console.log('（或复制到 .env.local 文件中）\n');

    console.log('# JWT 签名密钥');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log('');

    console.log('# 客户端 API 认证密钥');
    console.log(`CLIENT_API_KEY=${clientApiKey}`);
    console.log('');

    console.log('# ES256 私钥（防抓包篡改）');
    console.log(`RESPONSE_SIGN_PRIVATE_KEY_PEM="${privateKey.replace(/\n/g, '\\n')}"`);
    console.log('');

    console.log('# 可选：密钥版本标识');
    console.log('RESPONSE_SIGN_KEY_ID=key-v1');
    console.log('');

    console.log('# 可选：签名令牌有效期（秒）');
    console.log('RESPONSE_SIGN_TOKEN_TTL_SEC=120');
    console.log('');

    console.log('=== 客户端验签用公钥 ===');
    console.log('（客户端代码中需要内置此公钥）\n');
    console.log(publicKey);

    console.log('=== 安全提醒 ===');
    console.log('🔒 请妥善保管私钥，不要泄露给第三方');
    console.log('🔄 生产环境建议定期轮换密钥');
    console.log('📝 建议将公钥保存到客户端代码中');

} catch (error) {
    console.error('❌ 密钥生成失败:', error.message);
    process.exit(1);
} 