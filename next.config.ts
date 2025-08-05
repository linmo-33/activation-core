import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 警告：这将在生产构建期间完全禁用 ESLint。
    ignoreDuringBuilds: true,
  },

  // 安全头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      {
        // 管理员 API 的 CORS 配置
        source: '/api/admin/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://code.zerovv.top' : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      },
      {
        // 客户端 API 的 CORS 配置
        source: '/api/client/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*' // 允许所有域名访问客户端API
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, X-API-Key, User-Agent'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400' // 预检请求缓存24小时
          }
        ]
      }
    ];
  }
};

export default nextConfig;
