"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock3,
  Key,
  Plus,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  total_codes?: number;
  unused_codes?: number;
  used_codes?: number;
  expired_codes?: number;
  usage_rate?: number;
  active_rate?: number;
  total?: number;
  unused?: number;
  used?: number;
  expired?: number;
}

interface RecentActivation {
  id: number;
  code: string;
  used_by_device_id: string;
  used_at: string;
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_codes: 0,
    unused_codes: 0,
    used_codes: 0,
    expired_codes: 0,
    usage_rate: 0,
    active_rate: 0,
  });
  const [recentActivations, setRecentActivations] = useState<RecentActivation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await fetch("/api/admin/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const total = statsData.data.total || 0;
        const used = statsData.data.used || 0;
        const usageRate = total > 0 ? (used / total) * 100 : 0;

        setStats({
          total_codes: total,
          unused_codes: statsData.data.unused || 0,
          used_codes: used,
          expired_codes: statsData.data.expired || 0,
          usage_rate: usageRate,
        });
      }

      const recentResponse = await fetch("/api/admin/codes?status=used&limit=5");
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentActivations(
          recentData.data.codes.filter((code: any) => code.status === "used")
        );
      }
    } catch (error) {
      console.error("获取仪表板数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCodes = stats.total_codes || stats.total || 0;
  const unusedCodes = stats.unused_codes || stats.unused || 0;
  const usedCodes = stats.used_codes || stats.used || 0;
  const expiredCodes = stats.expired_codes || stats.expired || 0;

  const summaryItems = [
    {
      label: "总激活码",
      value: totalCodes,
      detail: stats.usage_rate ? `使用率 ${stats.usage_rate.toFixed(1)}%` : "当前总量",
    },
    {
      label: "未使用",
      value: unusedCodes,
      detail: "可立即分发",
    },
    {
      label: "已使用",
      value: usedCodes,
      detail: "已绑定设备",
    },
    {
      label: "已过期",
      value: expiredCodes,
      detail: expiredCodes > 0 ? "建议清理" : "当前无积压",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="mono-panel overflow-hidden">
          <div className="grid gap-8 p-7 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="data-kicker">系统概览</div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <h1 className="text-4xl font-semibold tracking-[-0.05em]">
                      后台概览
                    </h1>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                      查看激活码库存、最近使用记录和当前需要处理的状态。
                    </p>
                  </div>
                  <Button asChild size="lg">
                    <Link href="/admin/generate">
                      <Plus className="mr-2 h-4 w-4" />
                      生成激活码
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="hover-lift rounded-[1.4rem] border border-border/80 bg-background/75 p-5"
                  >
                    <div className="data-kicker">{item.label}</div>
                    <div className="mt-4 text-3xl font-semibold tracking-[-0.05em] display-code">
                      {isLoading ? "..." : formatNumber(item.value)}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-border/80 bg-background/72 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="data-kicker">最近记录</div>
                  <div className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                    最近激活
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/codes?status=used">查看全部</Link>
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border/70 bg-card/70 p-4 animate-pulse"
                    >
                      <div className="h-4 w-24 rounded bg-muted" />
                      <div className="mt-3 h-3 w-40 rounded bg-muted" />
                    </div>
                  ))
                ) : recentActivations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                    当前没有最近激活记录。
                  </div>
                ) : (
                  recentActivations.map((activation) => (
                    <div
                      key={activation.id}
                      className="hover-lift flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/70 p-4"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="display-code text-sm font-semibold tracking-[0.02em]">
                          {activation.code}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          设备标识：{activation.used_by_device_id}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <Badge variant="secondary">已使用</Badge>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {activation.used_at}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </AdminLayout>
  );
}
