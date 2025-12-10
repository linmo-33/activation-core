# 激活码管理系统

基于 Next.js 的激活码生成、管理和验证系统。

## ✨ 功能特性

- 📊 统计仪表板和数据分析
- 🎯 批量生成激活码（支持永久/日卡/月卡/指定时间）
- 📋 激活码管理（列表、搜索、筛选、分页）
- 🔄 设备管理和激活码重置
- 🚀 RESTful API 接口
- 🎨 现代化响应式 UI 设计
- 🎮 完整的客户端演示页面
- 🔐 ES256 响应签名验证（防抓包篡改）
- ⏰ 相对过期时间支持（日卡/月卡从激活时刻计算）
- 🎨 Lucide React 图标库统一风格

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

访问 `http://localhost:3000/admin` 进入管理后台。

## 🎮 客户端演示

项目包含一个功能完整的客户端演示页面，展示如何在浏览器环境中集成激活码验证功能，位于 `example` 下。

## 📚 使用指南

### 管理后台

访问 `http://localhost:3000/admin` 进入管理后台。

### 📖 技术文档

- **[激活系统使用指南](docs/activation-guide.md)** - 技术原理、API 接口和客户端集成示例（JavaScript + C 语言）
- **[有效期升级说明](docs/validity-days-migration.md)** - validity_days 字段迁移指南

## 🎮 客户端演示

### 目录

```
example/demo.html
```

## 🎯 激活码类型

### 1. ♾️ 永久激活码
- 永不过期
- 适合：永久授权、买断制软件

### 2. 📅 日卡
- 激活后 24 小时有效
- 从激活时刻开始计时
- 适合：短期试用、临时访问

### 3. 📆 月卡
- 激活后 30 天有效
- 从激活时刻开始计时
- 适合：月度订阅、会员服务

### 4. ⏰ 指定时间
- 在指定时间点过期（无论是否激活）
- 适合：限时活动、促销码

## 📚 使用指南

### 管理员登录

- 默认账户：`admin` / `admin123`
- ⚠️ 生产环境请立即修改默认密码

### API 使用

#### 激活码验证

```bash
curl -X POST /api/client/activate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"code": "U2m9Lw2cjOaV8WQDx3Hy", "device_id": "unique-device-id"}'
```

**成功响应：**
```json
{
  "success": true,
  "message": "激活成功",
  "data": {
    "code": "U2m9Lw2cjOaV8WQDx3Hy",
    "device_id": "unique-device-id",
    "activated_at": "2024-01-15 10:30:00",
    "expires_at": "2024-02-14 10:30:00",
    "license_token": "eyJhbGc..."
  }
}
```

**错误响应：**
```json
{
  "success": false,
  "message": "该设备已激活，每个设备只能同时使用一个激活码",
  "error_code": "DEVICE_ALREADY_ACTIVATED"
}
```

**错误码说明：**
- `DEVICE_ALREADY_ACTIVATED` - 设备已激活
- `CODE_ALREADY_USED` - 激活码已被使用
- `CODE_EXPIRED` - 激活码已过期
- `CODE_NOT_FOUND` - 激活码不存在

## 🚀 部署

```bash
# Vercel 部署（推荐）
# 1. 推送到 GitHub
# 2. 在 Vercel 导入项目并配置环境变量

# 手动部署
pnpm run build
pnpm start
```

### Vercel 部署详细步骤

**配置环境变量**（在 Vercel Project Settings → Environment Variables 中添加）

**核心配置（必需）：**

```
DATABASE_URL=postgresql://username:password@hostname:port/database_name?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
NODE_ENV=production
CLIENT_API_KEY=your-client-api-key-at-least-32-characters-long
```

**响应签名配置（必需）：**

```
RESPONSE_SIGN_PRIVATE_KEY_PEM=-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGBy...\n-----END PRIVATE KEY-----
RESPONSE_SIGN_KEY_ID=key-v1
RESPONSE_SIGN_TOKEN_TTL_SEC=120
```

4. **生成密钥的便捷方法**

   ```bash
   # 生成 JWT_SECRET 和 CLIENT_API_KEY
   node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('CLIENT_API_KEY:', require('crypto').randomBytes(32).toString('hex'))"

   # 生成 ES256 密钥对
   openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out es256-private.pem
   openssl pkey -in es256-private.pem -pubout -out es256-public.pem

   # 查看私钥内容（复制到环境变量）
   cat es256-private.pem
   ```

   **更快捷的 ES256 密钥生成方式：**

   **🚀 ：使用项目内置脚本（推荐）**

   ```bash
   # 一键生成所有必需密钥，格式化输出
   node scripts/generate-keys.js

   # 或者使用 pnpm
   pnpm run generate-keys  # 需要在 package.json 中添加此脚本
   ```

5. **环境变量设置注意事项**

   - `RESPONSE_SIGN_PRIVATE_KEY_PEM`: 需要包含完整的 PEM 头尾，换行符用 `\n` 转义
   - `DATABASE_URL`: 使用你的 PostgreSQL 数据库连接串（推荐 Supabase 或 Vercel Postgres）
   - 所有密钥都应该是生产环境专用的强随机值

6. **部署完成后**
   - 执行数据库初始化：在你的 PostgreSQL 中运行 `scripts/init-db.sql`
   - 访问 `https://your-app.vercel.app/admin` 测试管理后台
   - 使用默认账户 `admin/admin123` 登录（记得立即修改密码）

## 🔄 数据库迁移

### 新部署
直接使用 `scripts/init-db.sql` 初始化数据库，已包含所有最新字段。

### 已有系统升级
如果你的系统已经在运行，需要执行迁移脚本添加 `validity_days` 字段：

```bash
# 在 PostgreSQL 中执行
psql -U your_username -d your_database -f scripts/migrate-add-validity-days.sql
```

或在 Supabase SQL 编辑器中执行 `scripts/migrate-add-validity-days.sql` 的内容。

详细说明请查看 [有效期升级说明](docs/validity-days-migration.md)。

### 环境变量完整清单

| 变量名                          | 是否必需 | 说明                  | 示例值                             |
| ------------------------------- | -------- | --------------------- | ---------------------------------- |
| `DATABASE_URL`                  | ✅       | PostgreSQL 数据库连接 | `postgresql://...`                 |
| `JWT_SECRET`                    | ✅       | JWT 签名密钥          | 32 字符以上随机字符串              |
| `CLIENT_API_KEY`                | ✅       | 客户端 API 认证密钥   | 32 字符以上随机字符串              |
| `RESPONSE_SIGN_PRIVATE_KEY_PEM` | ✅       | ES256 私钥（防篡改）  | `-----BEGIN PRIVATE KEY-----\n...` |
| `NODE_ENV`                      | 建议     | 应用环境              | `production`                       |
| `RESPONSE_SIGN_KEY_ID`          | 可选     | 密钥版本标识          | `key-v1`                           |
| `RESPONSE_SIGN_TOKEN_TTL_SEC`   | 可选     | 签名令牌有效期        | `120`                              |

## 🎨 UI 特性

- **现代化设计**：基于 shadcn/ui 组件库
- **响应式布局**：完美适配桌面和移动端
- **深色模式**：支持明暗主题切换
- **图标系统**：使用 Lucide React 图标库
- **彩色徽章**：不同类型激活码用颜色区分
- **分页功能**：支持大量数据浏览
- **批量操作**：支持批量选择、重置、删除

## 🔧 最近更新

### v2.0.0 (2024-12-10)
- ✨ 添加日卡/月卡相对过期时间支持
- ✨ 优化激活码生成页面（永久/日卡/月卡/指定时间）
- ✨ 添加激活码列表分页功能
- ✨ 改进错误提示（详细错误码）
- 🎨 使用 Lucide React 图标替换 emoji
- 🎨 优化管理员头像区域样式
- 📝 更新首页 API 示例文档
- 🗄️ 添加 validity_days 字段支持

## 📄 许可证

MIT License
