# 多阶段构建 Dockerfile for Activation Core

# =========================================
# 1. 构建阶段 (Builder)
# - 使用 bullseye 确保依赖库可用
# - 优化缓存策略，仅在 package.json 或 package-lock.json 变动时才重装依赖
# =========================================
FROM node:18-bullseye AS builder
WORKDIR /app

# 安装系统依赖库，为 Prisma 和其他原生模块做准备
RUN apt-get update && apt-get install -y libc6 libssl1.1 && rm -rf /var/lib/apt/lists/*

# 仅复制包管理文件以利用缓存
COPY package.json package-lock.json* ./

# 安装所有依赖（包括开发依赖），这一步会被高效缓存
RUN npm ci

# 复制所有源代码
# 将此步骤后置，确保代码变更不会导致上面的依赖重装
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# 编译 TypeScript 脚本文件
RUN npx tsc scripts/init-admin.ts --outDir scripts --target es2018 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck

# =========================================
# 2. 生产运行阶段 (Runner)
# - 使用极简的 slim 镜像，大幅减小最终镜像体积
# =========================================
FROM node:18-bullseye-slim AS runner
WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_LEVEL=WARN
ENV DATABASE_URL="file:/app/data/prod.db"

# 创建非 root 用户，提升安全性
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid 1001 nextjs

# 从构建阶段复制必要产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# 创建数据目录并授权
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000


# 启动应用
CMD ["./docker-entrypoint.sh"]