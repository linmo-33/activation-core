"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AuthFrame({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-grid relative hidden overflow-hidden border-r border-border/70 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.05),transparent_34%)]" />
          <div className="relative flex w-full flex-col justify-between px-12 py-14 xl:px-16">
            <div className="space-y-5">
              <div className="data-kicker">Activation Core / Admin</div>
              <div className="max-w-xl space-y-5">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/10 bg-card">
                  {icon}
                </div>
                <h1 className="max-w-lg text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-foreground">
                  激活码管理后台
                </h1>
                <p className="max-w-md text-base leading-7 text-muted-foreground">
                  用于管理激活码、设备状态和后台配置。
                </p>
              </div>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-4">
              {[
                ["激活码", "生成、筛选、重置和清理激活码。"],
                ["设备", "查看设备激活状态与使用记录。"],
                ["后台", "适合单管理员场景的集中管理。"],
              ].map(([name, detail]) => (
                <div key={name} className="rounded-[1.4rem] border border-border/70 bg-card/80 p-4 backdrop-blur-sm">
                  <div className="text-sm font-semibold tracking-[-0.02em]">{name}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 md:px-8">
          <div className="w-full max-w-[460px]">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>

            <div className="rounded-[2rem] border border-border/80 bg-card/92 p-8 shadow-[0_36px_70px_-46px_rgba(15,23,42,0.38)] md:p-10">
              <div className="mb-8 space-y-4">
                <div className="data-kicker">{eyebrow}</div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-semibold tracking-[-0.05em]">{title}</h2>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <AuthFrame
      eyebrow="管理员认证"
      title="管理员登录"
      description="正在加载管理员登录界面。"
      icon={<KeyRound className="h-6 w-6" />}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          <div className="h-11 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          <div className="h-11 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="h-11 rounded-xl bg-muted animate-pulse" />
      </div>
    </AuthFrame>
  );
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin";
  const { refreshAuth } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.status === 403) {
        router.push("/admin/setup");
        router.refresh();
        return;
      }

      if (result.success) {
        await refreshAuth();
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 100);
      } else {
        setError(result.message || "登录失败");
      }
    } catch (error) {
      console.error("登录失败:", error);
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <AuthFrame
      eyebrow="管理员认证"
      title="管理员登录"
      description="请输入管理员用户名和密码。登录成功后将进入后台首页。"
      icon={<KeyRound className="h-6 w-6" />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="请输入管理员用户名"
            value={formData.username}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="pr-11"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-9 w-9 rounded-lg text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在验证身份
              </>
            ) : (
              "进入后台"
            )}
          </Button>

          <p className="text-xs leading-5 text-muted-foreground">
            如果这是首次部署，请先完成管理员初始化。
          </p>
        </div>
      </form>
    </AuthFrame>
  );
}
