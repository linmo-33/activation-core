import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Key,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Code,
  Database,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/80 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Key className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                  CodeKey
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                  激活码管理
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/login">
                <Button
                  variant="outline"
                  className="hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-slate-800"
                >
                  管理员登录
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 py-32 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8 dark:bg-blue-900/30 dark:text-blue-300">
              <CheckCircle className="w-4 h-4 mr-2" />
              简单易用的激活码管理工具
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-blue-100 dark:to-indigo-100">
                CodeKey
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-4xl md:text-5xl">
                激活码管理平台
              </span>
            </h1>

            <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12">
              <span className="text-lg text-slate-500 dark:text-slate-400">
                批量生成 • 状态管理 • API接口 • 数据统计
              </span>
            </p>

            <div className="flex items-center justify-center mb-20">
              <Link href="/admin">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-12 py-4 text-lg font-semibold"
                >
                  <Shield className="mr-3 h-6 w-6" />
                  进入管理后台
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* 特性展示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  简单
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  易于使用
                </div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  快速
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  批量生成
                </div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  安全
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  可靠验证
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="py-24 bg-white/50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
              核心功能
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              简单实用的激活码管理功能
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  批量生成
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  快速生成激活码，支持批量操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  快速便捷
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  安全验证
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  安全的激活码验证和设备绑定
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  安全可靠
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  管理后台
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  简洁的管理界面，查看和管理激活码
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  数据统计
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API 示例 */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
              简单易用的 API
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              几行代码即可集成激活码验证功能
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* API 请求示例 */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <CardTitle className="flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    API 请求示例
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <pre className="text-sm leading-relaxed overflow-x-auto">
                    <code className="text-green-400">{`POST`}</code>
                    <code className="text-blue-300">{` /api/client/activate`}</code>
                    <br />
                    <code className="text-yellow-300">{`Content-Type: application/json`}</code>
                    <br />
                    <code className="text-yellow-300">{`X-API-Key: your-api-key-here`}</code>
                    <br />
                    <code className="text-white">{`{`}</code>
                    <br />
                    <code className="text-cyan-300">{`  "code"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`"U2m9Lw2cjOaV8WQDx3Hy"`}</code>
                    <code className="text-white">{`,`}</code>
                    <br />
                    <code className="text-cyan-300">{`  "device_id"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`"unique-device-id"`}</code>
                    <br />
                    <code className="text-white">{`}`}</code>
                  </pre>
                </CardContent>
              </Card>

              {/* API 响应示例 */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-900 to-green-800 text-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    API 响应示例
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <pre className="text-sm leading-relaxed overflow-x-auto">
                    <code className="text-green-400">{`HTTP/1.1 200 OK`}</code>
                    <br />
                    <code className="text-yellow-300">{`Content-Type: application/json`}</code>
                    <br />
                    <br />
                    <code className="text-white">{`{`}</code>
                    <br />
                    <code className="text-cyan-300">{`  "success"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`true`}</code>
                    <code className="text-white">{`,`}</code>
                    <br />
                    <code className="text-cyan-300">{`  "message"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`"激活成功"`}</code>
                    <code className="text-white">{`,`}</code>
                    <br />
                    <code className="text-cyan-300">{`  "data"`}</code>
                    <code className="text-white">{`: {`}</code>
                    <br />
                    <code className="text-purple-300">{`    "code"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`"U2m9Lw2cjOaV8WQDx3Hy"`}</code>
                    <code className="text-white">{`,`}</code>
                    <br />
                    <code className="text-purple-300">{`    "device_id"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`"unique-device-id"`}</code>
                    <code className="text-white">{`,`}</code>
                    <br />
                    <code className="text-purple-300">{`    "activated_at"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`"2024-01-15 10:30:00"`}</code>
                    <code className="text-white">{`,`}</code>
                    <br />
                    <code className="text-purple-300">{`    "expires_at"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`"2024-02-14 10:30:00"`}</code>
                    <code className="text-white">{`,`}</code>
                    <br />
                    <code className="text-purple-300">{`    "license_token"`}</code>
                    <code className="text-white">{`: `}</code>
                    <code className="text-green-300">{`"eyJhbGc..."`}</code>
                    <br />
                    <code className="text-white">{`  }`}</code>
                    <br />
                    <code className="text-white">{`}`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>

            {/* 错误响应示例 */}
            <Card className="mt-8 border-0 shadow-xl bg-gradient-to-br from-red-900 to-orange-800 text-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                <CardTitle className="flex items-center">
                  <Code className="w-5 h-5 mr-2" />
                  错误响应示例
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <pre className="text-sm leading-relaxed overflow-x-auto">
                  <code className="text-red-400">{`HTTP/1.1 400 Bad Request`}</code>
                  <br />
                  <code className="text-yellow-300">{`Content-Type: application/json`}</code>
                  <br />
                  <br />
                  <code className="text-white">{`{`}</code>
                  <br />
                  <code className="text-cyan-300">{`  "success"`}</code>
                  <code className="text-white">{`: `}</code>
                  <code className="text-red-300">{`false`}</code>
                  <code className="text-white">{`,`}</code>
                  <br />
                  <code className="text-cyan-300">{`  "message"`}</code>
                  <code className="text-white">{`: `}</code>
                  <code className="text-orange-300">{`"该设备已激活，每个设备只能同时使用一个激活码"`}</code>
                  <code className="text-white">{`,`}</code>
                  <br />
                  <code className="text-cyan-300">{`  "error_code"`}</code>
                  <code className="text-white">{`: `}</code>
                  <code className="text-orange-300">{`"DEVICE_ALREADY_ACTIVATED"`}</code>
                  <br />
                  <code className="text-white">{`}`}</code>
                </pre>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/80 mb-2">常见错误码：</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-start gap-2">
                      <code className="text-orange-300">DEVICE_ALREADY_ACTIVATED</code>
                      <span className="text-white/60">- 设备已激活</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="text-orange-300">CODE_ALREADY_USED</code>
                      <span className="text-white/60">- 激活码已被使用</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="text-orange-300">CODE_EXPIRED</code>
                      <span className="text-white/60">- 激活码已过期</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="text-orange-300">CODE_NOT_FOUND</code>
                      <span className="text-white/60">- 激活码不存在</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 特性说明 */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-2xl bg-blue-50 dark:bg-slate-800">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  安全可靠
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  HTTPS 加密传输，防重放攻击
                </p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-green-50 dark:bg-slate-800">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  响应迅速
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  平均响应时间 100ms
                </p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-purple-50 dark:bg-slate-800">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  易于集成
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  RESTful 设计，支持所有语言
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Key className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold">CodeKey</span>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-slate-400">
                &copy; 2024 CodeKey · 基于 Next.js 构建
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
