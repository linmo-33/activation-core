# [cite_start]多阶段构建 Dockerfile for Activation Core [cite: 1]

# ===== 依赖安装阶段 =====
FROM node:18-bullseye AS deps
# 安装依赖库
[cite_start]RUN apt-get update && apt-get install -y libc6 libssl1.1 && rm -rf /var/lib/apt/lists/* [cite: 1]
[cite_start]WORKDIR /app [cite: 1]

# 复制包管理文件
[cite_start]COPY package.json package-lock.json* ./ [cite: 1]
# 安装依赖
[cite_start]RUN npm ci --only=production [cite: 1]

# ===== 构建阶段 =====
FROM node:18 AS builder
[cite_start]WORKDIR /app [cite: 1]

# 复制依赖和源代码
[cite_start]COPY --from=deps /app/node_modules ./node_modules [cite: 1]
COPY . [cite_start]. [cite: 1, 2]

# 安装所有依赖（包括开发依赖）
[cite_start]RUN npm ci [cite: 2]

# 生成 Prisma 客户端
[cite_start]RUN npx prisma generate [cite: 2]

# 构建 Next.js 应用
[cite_start]RUN npm run build [cite: 2]

# 编译 TypeScript 脚本文件
[cite_start]RUN npx tsc scripts/init-admin.ts --outDir scripts --target es2018 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck [cite: 2]

# ===== 生产运行阶段 =====
FROM node:18 AS runner
[cite_start]WORKDIR /app [cite: 2]

# 设置生产环境
[cite_start]ENV NODE_ENV=production [cite: 2]
[cite_start]ENV NEXT_TELEMETRY_DISABLED=1 [cite: 2]
[cite_start]ENV LOG_LEVEL=WARN [cite: 2]
[cite_start]ENV DATABASE_URL="file:/app/data/prod.db" [cite: 2]

# 创建非root用户
[cite_start]RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid 1001 nextjs [cite: 2]

# 复制必需的文件
[cite_start]COPY --from=builder /app/.next/standalone ./ [cite: 2]
[cite_start]COPY --from=builder /app/.next/static ./.next/static [cite: 2]
[cite_start]COPY --from=builder /app/public ./public [cite: 2]
[cite_start]COPY --from=builder /app/prisma ./prisma [cite: 2]
[cite_start]COPY --from=builder /app/scripts ./scripts [cite: 2]

# 复制入口脚本
[cite_start]COPY docker-entrypoint.sh ./ [cite: 2]
[cite_start]RUN chmod +x docker-entrypoint.sh [cite: 2]

# 创建数据目录并设置权限
[cite_start]RUN mkdir -p /app/data [cite: 2]
[cite_start]RUN chown -R nextjs:nodejs /app/data [cite: 2]
[cite_start]RUN chown -R nextjs:nodejs /app/prisma [cite: 2]

# 设置用户
[cite_start]USER nextjs [cite: 2]

# 暴露端口
[cite_start]EXPOSE 3000 [cite: 2]

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  [cite_start]CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1 [cite: 3]

# 启动应用
[cite_start]CMD ["./docker-entrypoint.sh"] [cite: 3]