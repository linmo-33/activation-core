"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SetupFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-grid relative hidden overflow-hidden border-r border-border/70 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.09),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.045),transparent_35%)]" />
          <div className="relative flex w-full flex-col justify-between px-12 py-14 xl:px-16">
            <div className="space-y-5">
              <div className="data-kicker">首次部署 / 管理员初始化</div>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-foreground/10 bg-card">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="max-w-xl space-y-5">
                <h1 className="text-5xl font-semibold leading-[0.92] tracking-[-0.06em]">
                  首次部署先创建管理员账号
                </h1>
                <p className="max-w-md text-base leading-7 text-muted-foreground">
                  系统不会提供默认账号。初始化完成后，该入口会自动关闭，后续请通过登录页进入后台。
                </p>
              </div>
            </div>

            <div className="max-w-xl rounded-[1.6rem] border border-border/70 bg-card/82 p-5">
              <div className="data-kicker">初始化规则</div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>用户名长度限制为 3 到 32 位，仅允许字母、数字、下划线和短横线。</li>
                <li>密码长度至少 6 位，建议使用仅你自己掌握的高强度密码。</li>
                <li>管理员初始化成功后，系统不会再公开展示该页面。</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 md:px-8">
          <div className="w-full max-w-[500px]">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>

            <div className="rounded-[2rem] border border-border/80 bg-card/92 p-8 shadow-[0_36px_70px_-46px_rgba(15,23,42,0.38)] md:p-10">
              <div className="mb-8 space-y-4">
                <div className="data-kicker">管理员初始化</div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-semibold tracking-[-0.05em]">首次初始化</h2>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    创建系统管理员账号。该页面仅在首次部署时可用。
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

export function SetupPageSkeleton() {
  return (
    <SetupFrame>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-14 rounded bg-muted animate-pulse" />
            <div className="h-11 rounded-xl bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </SetupFrame>
  );
}

export function AdminSetupForm() {
  const router = useRouter();
  const { refreshAuth } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await refreshAuth();
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 100);
      } else {
        setError(result.message || "初始化失败");
        if (response.status === 403) {
          setTimeout(() => {
            router.push("/admin/login");
            router.refresh();
          }, 800);
        }
      }
    } catch (error) {
      console.error("初始化失败:", error);
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SetupFrame>
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
            placeholder="例如：admin_owner"
            value={formData.username}
            onChange={handleInputChange}
            minLength={3}
            maxLength={32}
            required
            disabled={isLoading}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            只允许字母、数字、下划线和短横线。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="至少 6 位"
              value={formData.password}
              onChange={handleInputChange}
              minLength={6}
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认密码</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="再次输入密码"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              minLength={6}
              required
              disabled={isLoading}
              className="pr-11"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-9 w-9 rounded-lg text-muted-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
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
                正在创建管理员账号
              </>
            ) : (
              "创建管理员并进入后台"
            )}
          </Button>

          <p className="text-xs leading-5 text-muted-foreground">
            初始化成功后，该入口会自动关闭。后续仅允许通过登录页进入后台。
          </p>
        </div>
      </form>
    </SetupFrame>
  );
}
