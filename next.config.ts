import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 警告：这将在生产构建期间完全禁用 ESLint。
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
