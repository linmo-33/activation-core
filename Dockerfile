# 多阶段构建 Dockerfile for Activation Core

# ===== 依赖安装阶段 =====
FROM node:18-alpine AS deps
# 检查 https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine 了解为什么可能需要 libc6-compat
RUN apk add --no-cache libc6-compat openssl1.1-compat
WORKDIR /app

# 复制包管理文件
COPY package.json package-lock.json* ./
# 安装依赖
RUN npm ci --only=production

# ===== 构建阶段 =====
FROM node:18-alpine AS builder
WORKDIR /app

# 复制依赖和源代码
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# 编译 TypeScript 脚本文件
RUN npx tsc scripts/init-admin.ts --outDir scripts --target es2018 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck

# ===== 生产运行阶段 =====
FROM node:18-alpine AS runner
WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_LEVEL=WARN
ENV DATABASE_URL="file:/app/data/prod.db"

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必需的文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# 复制入口脚本
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# 创建数据目录并设置权限
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app/data
RUN chown -R nextjs:nodejs /app/prisma

# 设置用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["./docker-entrypoint.sh"] 