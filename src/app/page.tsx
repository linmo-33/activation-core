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
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  Database,
  Gauge,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const currentYear = new Date().getFullYear();
  const codeCardClassName =
    "overflow-hidden rounded-[1.75rem] border border-[#3a3d46] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_34%),linear-gradient(180deg,#242730_0%,#1b1d24_100%)] text-white shadow-[0_30px_80px_-38px_rgba(0,0,0,0.72)]";
  const codeCardHeaderClassName =
    "border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] text-white";
  const codeCardBodyClassName = "bg-transparent p-6";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-neutral-950 text-white shadow-[0_16px_34px_-24px_rgba(0,0,0,0.75)]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-neutral-950 to-neutral-700 bg-clip-text text-xl font-bold text-transparent dark:from-white dark:to-neutral-400">
                  CodeKey
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  激活码管理
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/login">
                <Button variant="outline">登录</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="surface-grid relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,hsl(210_14%_10%/0.08),transparent_62%)] blur-3xl" />
          <div className="absolute right-[18%] top-24 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,hsl(200_30%_55%/0.12),transparent_65%)] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-32 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8 inline-flex items-center rounded-full border border-border/80 bg-card/88 px-4 py-2 text-sm font-medium text-foreground shadow-[0_16px_34px_-28px_rgba(0,0,0,0.45)]">
              <CheckCircle2 className="mr-2 h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              简单易用的激活码管理工具
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              <span className="bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-600 bg-clip-text text-transparent dark:from-white dark:via-neutral-200 dark:to-neutral-500">
                CodeKey
              </span>
              <br />
              <span className="bg-gradient-to-r from-neutral-700 to-neutral-500 bg-clip-text text-4xl text-transparent md:text-5xl dark:from-neutral-200 dark:to-neutral-400">
                激活码管理平台
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-muted-foreground">
              <span className="text-lg text-muted-foreground">
                批量生成 • 状态管理 • API接口 • 数据统计
              </span>
            </p>

            <div className="flex items-center justify-center mb-20">
              <Link href="/admin">
                <Button
                  size="lg"
                  className="h-14 rounded-2xl border border-neutral-900 bg-neutral-950 px-12 py-4 text-lg font-semibold text-white shadow-[0_24px_46px_-28px_rgba(0,0,0,0.8)] hover:bg-neutral-800"
                >
                  <ShieldCheck className="mr-3 h-6 w-6" />
                  进入管理后台
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* 特性展示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-card/92 shadow-[0_18px_34px_-26px_rgba(0,0,0,0.55)]">
                  <Gauge className="h-8 w-8 text-neutral-800 dark:text-neutral-200" />
                </div>
                <div className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                  简单
                </div>
                <div className="text-muted-foreground">易于使用</div>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-card/92 shadow-[0_18px_34px_-26px_rgba(0,0,0,0.55)]">
                  <BarChart3 className="h-8 w-8 text-neutral-800 dark:text-neutral-200" />
                </div>
                <div className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                  快速
                </div>
                <div className="text-muted-foreground">批量生成</div>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-card/92 shadow-[0_18px_34px_-26px_rgba(0,0,0,0.55)]">
                  <ShieldCheck className="h-8 w-8 text-neutral-800 dark:text-neutral-200" />
                </div>
                <div className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                  安全
                </div>
                <div className="text-muted-foreground">可靠验证</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="border-y border-border/70 bg-card/42 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="mb-4 bg-gradient-to-r from-neutral-950 to-neutral-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-white dark:to-neutral-400">
              核心功能
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              简单实用的激活码管理功能
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group border-border/80 bg-card/88 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/12 hover:shadow-[0_26px_48px_-34px_rgba(0,0,0,0.55)]">
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-neutral-950 text-white shadow-[0_18px_32px_-24px_rgba(0,0,0,0.75)] transition-transform duration-300 group-hover:scale-110">
                  <Gauge className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  批量生成
                </CardTitle>
                <CardDescription className="leading-relaxed text-slate-600 dark:text-slate-300">
                  快速生成激活码，支持批量操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-foreground">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                  快速便捷
                </div>
              </CardContent>
            </Card>

            <Card className="group border-border/80 bg-card/88 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/12 hover:shadow-[0_26px_48px_-34px_rgba(0,0,0,0.55)]">
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-neutral-950 text-white shadow-[0_18px_32px_-24px_rgba(0,0,0,0.75)] transition-transform duration-300 group-hover:scale-110">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  安全验证
                </CardTitle>
                <CardDescription className="leading-relaxed text-slate-600 dark:text-slate-300">
                  安全的激活码验证和设备绑定
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-foreground">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                  安全可靠
                </div>
              </CardContent>
            </Card>

            <Card className="group border-border/80 bg-card/88 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/12 hover:shadow-[0_26px_48px_-34px_rgba(0,0,0,0.55)]">
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-neutral-950 text-white shadow-[0_18px_32px_-24px_rgba(0,0,0,0.75)] transition-transform duration-300 group-hover:scale-110">
                  <Database className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  管理后台
                </CardTitle>
                <CardDescription className="leading-relaxed text-slate-600 dark:text-slate-300">
                  简洁的管理界面，查看和管理激活码
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-foreground">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-neutral-600 dark:text-neutral-300" />
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
            <h2 className="mb-4 bg-gradient-to-r from-neutral-950 to-neutral-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-white dark:to-neutral-400">
              简单易用的 API
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              几行代码即可集成激活码验证功能
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* API 请求示例 */}
              <Card className={codeCardClassName}>
                <CardHeader className={codeCardHeaderClassName}>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Code2 className="mr-2 h-5 w-5" />
                      API 请求示例
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={codeCardBodyClassName}>
                  <pre className="text-sm leading-relaxed overflow-x-auto">
                    <code className="text-emerald-300">{`POST`}</code>
                    <code className="text-sky-200">{` /api/client/activate`}</code>
                    <br />
                    <code className="text-amber-200">{`Content-Type: application/json`}</code>
                    <br />
                    <code className="text-amber-200">{`X-API-Key: your-api-key-here`}</code>
                    <br />
                    <code className="text-neutral-100">{`{`}</code>
                    <br />
                    <code className="text-cyan-200">{`  "code"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`"U2m9Lw2cjOaV8WQDx3Hy"`}</code>
                    <code className="text-neutral-100">{`,`}</code>
                    <br />
                    <code className="text-cyan-200">{`  "device_id"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`"unique-device-id"`}</code>
                    <br />
                    <code className="text-neutral-100">{`}`}</code>
                  </pre>
                </CardContent>
              </Card>

              {/* API 响应示例 */}
              <Card className={codeCardClassName}>
                <CardHeader className={codeCardHeaderClassName}>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      API 响应示例
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={codeCardBodyClassName}>
                  <pre className="text-sm leading-relaxed overflow-x-auto">
                    <code className="text-emerald-300">{`HTTP/1.1 200 OK`}</code>
                    <br />
                    <code className="text-amber-200">{`Content-Type: application/json`}</code>
                    <br />
                    <br />
                    <code className="text-neutral-100">{`{`}</code>
                    <br />
                    <code className="text-cyan-200">{`  "success"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`true`}</code>
                    <code className="text-neutral-100">{`,`}</code>
                    <br />
                    <code className="text-cyan-200">{`  "message"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`"激活成功"`}</code>
                    <code className="text-neutral-100">{`,`}</code>
                    <br />
                    <code className="text-cyan-200">{`  "data"`}</code>
                    <code className="text-neutral-100">{`: {`}</code>
                    <br />
                    <code className="text-violet-200">{`    "code"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`"U2m9Lw2cjOaV8WQDx3Hy"`}</code>
                    <code className="text-neutral-100">{`,`}</code>
                    <br />
                    <code className="text-violet-200">{`    "device_id"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`"unique-device-id"`}</code>
                    <code className="text-neutral-100">{`,`}</code>
                    <br />
                    <code className="text-violet-200">{`    "activated_at"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`"2024-01-15 10:30:00"`}</code>
                    <code className="text-neutral-100">{`,`}</code>
                    <br />
                    <code className="text-violet-200">{`    "expires_at"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`"2024-02-14 10:30:00"`}</code>
                    <code className="text-neutral-100">{`,`}</code>
                    <br />
                    <code className="text-violet-200">{`    "license_token"`}</code>
                    <code className="text-neutral-100">{`: `}</code>
                    <code className="text-emerald-200">{`"eyJhbGc..."`}</code>
                    <br />
                    <code className="text-neutral-100">{`  }`}</code>
                    <br />
                    <code className="text-neutral-100">{`}`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>

            {/* 错误响应示例 */}
            <Card className={`mt-8 ${codeCardClassName}`}>
              <CardHeader className={codeCardHeaderClassName}>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Code2 className="mr-2 h-5 w-5" />
                    错误响应示例
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className={codeCardBodyClassName}>
                <pre className="text-sm leading-relaxed overflow-x-auto">
                  <code className="text-rose-300">{`HTTP/1.1 400 Bad Request`}</code>
                  <br />
                  <code className="text-amber-200">{`Content-Type: application/json`}</code>
                  <br />
                  <br />
                  <code className="text-neutral-100">{`{`}</code>
                  <br />
                  <code className="text-cyan-200">{`  "success"`}</code>
                  <code className="text-neutral-100">{`: `}</code>
                  <code className="text-rose-200">{`false`}</code>
                  <code className="text-neutral-100">{`,`}</code>
                  <br />
                  <code className="text-cyan-200">{`  "message"`}</code>
                  <code className="text-neutral-100">{`: `}</code>
                  <code className="text-orange-200">{`"该设备已激活，每个设备只能同时使用一个激活码"`}</code>
                  <code className="text-neutral-100">{`,`}</code>
                  <br />
                  <code className="text-cyan-200">{`  "error_code"`}</code>
                  <code className="text-neutral-100">{`: `}</code>
                  <code className="text-orange-200">{`"DEVICE_ALREADY_ACTIVATED"`}</code>
                  <br />
                  <code className="text-neutral-100">{`}`}</code>
                </pre>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/80 mb-2">常见错误码：</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-start gap-2">
                      <code className="text-orange-300">
                        DEVICE_ALREADY_ACTIVATED
                      </code>
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
              <div className="rounded-2xl border border-border/80 bg-card/88 p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/80 bg-secondary">
                  <ShieldCheck className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                  安全可靠
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  HTTPS 加密传输，防重放攻击
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/88 p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/80 bg-secondary">
                  <Gauge className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                  响应迅速
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  平均响应时间 100ms
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/88 p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/80 bg-secondary">
                  <Code2 className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
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
      <footer className="bg-neutral-950 text-white">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold">CodeKey</span>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-slate-400">
                &copy; {currentYear} CodeKey · 基于 Next.js 构建
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
