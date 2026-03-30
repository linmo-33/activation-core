"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Key,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Smartphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "概览",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "激活码",
    href: "/admin/codes",
    icon: Key,
  },
  {
    name: "生成",
    href: "/admin/generate",
    icon: Plus,
  },
  {
    name: "设备",
    href: "/admin/devices",
    icon: Smartphone,
  },
  {
    name: "设置",
    href: "/admin/settings",
    icon: Settings,
  },
];

function formatSectionName(pathname: string) {
  return navigation.find((item) => item.href === pathname)?.name ?? "控制台";
}

function SidebarContent({
  pathname,
  isLoading,
  username,
  logout,
  onClose,
  mobile = false,
}: {
  pathname: string;
  isLoading: boolean;
  username?: string;
  logout: () => void;
  onClose?: () => void;
  mobile?: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="flex h-[92px] shrink-0 items-center justify-between border-b border-white/10 px-7">
        <div className="space-y-1">
          <div className="data-kicker text-neutral-500">Activation Core</div>
          <Link href="/admin" className="inline-flex items-center gap-3" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <div className="text-base font-semibold tracking-[-0.02em]">管理后台</div>
              <div className="text-xs text-neutral-500">激活码与设备管理</div>
            </div>
          </Link>
        </div>

        {mobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="data-kicker px-3 pb-3 text-neutral-500">后台导航</div>
        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-all duration-200",
                  isActive
                    ? "bg-white text-neutral-950 shadow-[0_18px_30px_-24px_rgba(255,255,255,0.8)]"
                    : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isActive ? "" : "group-hover:translate-x-[1px]"
                  )}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-white/10 p-5">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center gap-3">
            {isLoading || !username ? (
              <>
                <div className="h-11 w-11 rounded-2xl bg-white/10 animate-pulse" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-24 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-11 w-11 rounded-2xl border border-white/10">
                  <AvatarFallback className="rounded-2xl bg-white text-sm font-semibold text-neutral-950">
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{username}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    在线管理
                  </div>
                </div>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const currentSection = useMemo(() => formatSectionName(pathname), [pathname]);

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-full">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[292px] transition-transform duration-200 lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent
            pathname={pathname}
            isLoading={isLoading}
            username={user?.username}
            logout={logout}
            onClose={() => setSidebarOpen(false)}
            mobile
          />
        </aside>

        <aside className="hidden h-full w-[292px] shrink-0 border-r border-white/10 bg-neutral-950 lg:block">
          <div className="h-full">
            <SidebarContent
              pathname={pathname}
              isLoading={isLoading}
              username={user?.username}
              logout={logout}
            />
          </div>
        </aside>

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-border/70 bg-background/88 backdrop-blur-xl">
            <div className="mx-auto flex h-[92px] w-full max-w-[1600px] items-center justify-between px-5 md:px-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>

                <div className="space-y-1">
                  <div className="data-kicker">后台工作区</div>
                  <div className="text-2xl font-semibold tracking-[-0.04em]">
                    {currentSection}
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-3 md:flex" />
            </div>
          </header>

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] px-5 py-6 md:px-8 md:py-8">
              <div className="page-enter">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
