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
};

export default nextConfig;
