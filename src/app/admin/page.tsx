"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Key,
  Users,
  Clock,
  AlertTriangle,
  Plus,
  BarChart3,
  TrendingUp,
  Shield,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  total_codes?: number;
  unused_codes?: number;
  used_codes?: number;
  expired_codes?: number;
  usage_rate?: number;
  active_rate?: number;
  // 兼容旧格式
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_codes: 0,
    unused_codes: 0,
    used_codes: 0,
    expired_codes: 0,
    usage_rate: 0,
    active_rate: 0,
  });

  const [recentActivations, setRecentActivations] = useState<
    RecentActivation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 获取基础统计数据
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

      // 获取最近激活记录
      const recentResponse = await fetch(
        "/api/admin/codes?status=used&limit=5"
      );
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 欢迎信息 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
            <p className="text-muted-foreground">
              欢迎回来！这里是您的激活码管理概览。
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/generate">
              <Plus className="mr-2 h-4 w-4" />
              生成激活码
            </Link>
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总激活码</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.total_codes || stats.total || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                {stats.usage_rate
                  ? `使用率 ${stats.usage_rate.toFixed(1)}%`
                  : "系统总量"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未使用</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(stats.unused_codes || stats.unused || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">可用激活码数量</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已使用</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(stats.used_codes || stats.used || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">已激活设备数量</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已过期</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(stats.expired_codes || stats.expired || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">需要清理的过期码</p>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容区域 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 最近激活记录 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                最近激活记录
              </CardTitle>
              <CardDescription>最新的激活码使用情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-pulse">加载中...</div>
                  </div>
                ) : recentActivations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无激活记录
                  </div>
                ) : (
                  recentActivations.map((activation) => (
                    <div
                      key={activation.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {activation.code}
                        </code>
                        <p className="text-xs text-muted-foreground">
                          设备: {activation.used_by_device_id}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="secondary">已使用</Badge>
                        <p className="text-xs text-muted-foreground">
                          {activation.used_at}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/codes?status=used">查看全部记录</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                快速操作
              </CardTitle>
              <CardDescription>常用的管理操作</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" size="lg" asChild>
                <Link href="/admin/generate">
                  <Plus className="mr-2 h-4 w-4" />
                  批量生成激活码
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                asChild
              >
                <Link href="/admin/codes">
                  <Key className="mr-2 h-4 w-4" />
                  查看激活码列表
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                asChild
              >
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  系统设置
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
