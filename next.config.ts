import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  eslint: {
    // 在构建时禁用 ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 如果也想禁用 TypeScript 检查
    ignoreBuildErrors: true,
  },
  // 启用独立构建输出，用于Docker部署
  output: 'standalone',
};

export default nextConfig;
