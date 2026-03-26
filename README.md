# activation-core

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![许可证](https://img.shields.io/badge/许可证-MIT-green)](LICENSE)
[![状态](https://img.shields.io/badge/状态-重构中-orange)](#项目状态)

`activation-core` 是一个面向单管理员场景的激活码管理系统，提供激活码生成、设备绑定、状态验证和基础后台管理能力。

## 功能特性

- 首次初始化创建唯一管理员账号
- 管理后台登录与基础统计
- 激活码生成、筛选、分页、重置
- 设备激活状态查询与管理
- 客户端激活与验证接口

## 技术栈

- Next.js 16
- React 19
- TypeScript
- PostgreSQL
- Tailwind CSS

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，并至少配置：

```bash
DATABASE_URL=postgresql://username:password@hostname:port/database_name?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
CLIENT_API_KEY=your-client-api-key-at-least-32-characters-long
RESPONSE_SIGN_PRIVATE_KEY_PEM=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
RESPONSE_SIGN_KEY_ID=key-v1
RESPONSE_SIGN_TOKEN_TTL_SEC=120
NODE_ENV=development
```

### 3. 初始化数据库

在 PostgreSQL 中执行：

```bash
scripts/init-db.sql
```

### 4. 启动项目

```bash
pnpm run dev
```

默认入口：

- 首页：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`

## 首次初始化

系统不再提供默认管理员账号。

新部署系统首次访问 `/admin` 或 `/admin/login` 时，会自动跳转到 `/admin/setup`，用于创建唯一管理员账号。系统完成初始化后，该入口会自动关闭。

## 常用脚本

```bash
pnpm run dev
pnpm run build
pnpm run start
pnpm run generate-keys
pnpm run hash-password -- <password>
```

## 项目结构

```text
src/
  app/          路由与页面
  components/   界面与后台组件
  contexts/     前端状态管理
  lib/          鉴权、数据库、签名与工具函数
scripts/        数据库与辅助脚本
example/        客户端示例
```

## 项目状态

当前仓库正在进行认证、安全和文档结构重构。

- README 是当前唯一优先维护的公开入口文档
- 详细产品文档后续迁移到专门的文档系统
- 涉及初始化、认证和接口安全的行为，以当前代码实现为准

## 许可证

MIT
