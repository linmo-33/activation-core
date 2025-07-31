import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Key, Shield, Zap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* 导航栏 */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">激活码管理系统</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/login">
                <Button variant="outline">管理员登录</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            专业的
            <span className="text-primary"> 激活码管理 </span>
            解决方案
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            为企业级应用提供安全、高效的激活码生成、管理和验证服务。
            支持批量生成、状态跟踪、设备绑定等完整功能。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/admin">
              <Button size="lg">
                <Shield className="mr-2 h-4 w-4" />
                进入管理后台
              </Button>
            </Link>
            <Link href="/admin/codes">
              <Button variant="outline" size="lg">
                查看激活码
                <Key className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">核心功能</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            完整的激活码生命周期管理
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>批量生成</CardTitle>
              <CardDescription>
                快速生成大量激活码，支持自定义过期时间和格式
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>安全验证</CardTitle>
              <CardDescription>
                提供安全的 API 接口，支持设备绑定和状态验证
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>管理后台</CardTitle>
              <CardDescription>
                直观的管理界面，支持激活码查看、重置和统计分析
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* API 示例 */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">简单易用的 API</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            几行代码即可集成激活码验证功能
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>激活码验证示例</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code className="text-sm">{`POST /api/client/activate
{
  "code": "U2m9Lw2cjOaV8WQDx3Hy",
  "device_id": "unique-device-id"
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 激活码管理系统. 基于 Next.js 构建.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
