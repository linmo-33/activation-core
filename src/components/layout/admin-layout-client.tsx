"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Key,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Smartphone,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "仪表板",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "激活码管理",
    href: "/admin/codes",
    icon: Key,
  },
  {
    name: "生成激活码",
    href: "/admin/generate",
    icon: Plus,
  },
  {
    name: "设备管理",
    href: "/admin/devices",
    icon: Smartphone,
  },
  {
    name: "系统设置",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo 区域 */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                <Key className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">
                  CodeKey
                </span>
                <div className="text-xs text-muted-foreground">管理后台</div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* 底部用户信息 */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-3">
              {isLoading || !user ? (
                // 加载状态或错误状态
                <>
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-muted rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                  </div>
                </>
              ) : (
                // 用户信息
                <>
                  <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-base font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      管理员
                    </p>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">
              {navigation.find((item) => item.href === pathname)?.name ||
                "仪表板"}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {/* 这里可以添加通知、用户菜单等 */}
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
