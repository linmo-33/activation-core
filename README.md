# 激活码管理系统

基于 Next.js 的激活码生成、管理和验证系统。

## ✨ 功能特性

- 📊 统计仪表板和数据分析
- 🎯 批量生成激活码
- 📋 激活码管理
- 🔄 设备管理和激活码重置
- 🚀 RESTful API 接口
- 🎨 现代化响应式 UI 设计

## 🛠️ 技术栈

- **框架**: Next.js 15 + TypeScript
- **数据库**: PostgreSQL
- **UI**: shadcn/ui + Tailwind CSS
- **认证**: JWT
- **部署**: Vercel

## 🚀 快速开始

```bash
# 1. 克隆和安装
git clone https://github.com/linmo-33/activation-core.git
cd activation-core
pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入数据库连接等配置

# 3. 初始化数据库
# 在 PostgreSQL 中执行 scripts/init-db.sql

# 4. 启动项目
pnpm run dev
```

访问 [http://localhost:3000/admin](http://localhost:3000/admin) 进入管理后台。

## 📚 使用指南

### 管理员登录

- 默认账户：`admin` / `admin123`
- ⚠️ 生产环境请立即修改默认密码

### API 使用

```bash
# 激活码验证
curl -X POST /api/client/activate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"code": "ACTIVATION_CODE", "device_id": "DEVICE_ID"}'
```

## 🚀 部署

```bash
# Vercel 部署（推荐）
# 1. 推送到 GitHub
# 2. 在 Vercel 导入项目并配置环境变量

# 手动部署
pnpm run build
pnpm start
```

## 📄 许可证

MIT License
