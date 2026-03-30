"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Hash,
  RotateCcw,
  Search,
  Smartphone,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import { ActionConfirmDialog } from "@/components/admin/action-confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getActivationCodeTypeMeta } from "@/lib/activation-code-type";

interface DeviceActivationRecord {
  id: number;
  code: string;
  status: "unused" | "used";
  used_at: string | null;
  expires_at: string | null;
  created_at?: string | null;
  validity_days: number | null;
}

interface DeviceActivationInfo {
  device_id: string;
  is_activated: boolean;
  has_expired_activations?: boolean;
  current_activation?: DeviceActivationRecord;
  activation_history: DeviceActivationRecord[];
  total_activations: number;
}

function getDeviceStatusBadge(info: DeviceActivationInfo) {
  if (info.is_activated) {
    return <Badge variant="default" className="px-3 tracking-[0.08em]">已激活</Badge>;
  }

  if (info.has_expired_activations) {
    return <Badge variant="outline" className="border-amber-200 bg-amber-50 px-3 tracking-[0.08em] text-amber-900">历史已过期</Badge>;
  }

  return <Badge variant="secondary" className="px-3 tracking-[0.08em]">未激活</Badge>;
}

function getHistoryStatusBadge(record: DeviceActivationRecord) {
  const isExpired = record.expires_at ? new Date(record.expires_at) < new Date() : false;

  if (record.status === "used" && !isExpired) {
    return <Badge variant="default" className="px-3 tracking-[0.08em]">有效</Badge>;
  }

  if (record.status === "used" && isExpired) {
    return <Badge variant="outline" className="border-amber-200 bg-amber-50 px-3 tracking-[0.08em] text-amber-900">已过期</Badge>;
  }

  return <Badge variant="secondary" className="px-3 tracking-[0.08em]">未使用</Badge>;
}

function getTypeBadge(record: DeviceActivationRecord) {
  const meta = getActivationCodeTypeMeta({
    validityDays: record.validity_days,
    expiresAt: record.expires_at,
  });

  return (
    <Badge variant="outline" className={cn("px-3 tracking-[0.08em]", meta.badgeClassName)}>
      {meta.title}
    </Badge>
  );
}

export default function DevicesPage() {
  const { toast } = useToast();
  const [searchDeviceId, setSearchDeviceId] = useState("");
  const [deviceInfo, setDeviceInfo] = useState<DeviceActivationInfo | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const activeHistoryCount = useMemo(() => {
    if (!deviceInfo) return 0;
    return deviceInfo.activation_history.filter((record) => {
      if (record.status !== "used") return false;
      if (!record.expires_at) return true;
      return new Date(record.expires_at) >= new Date();
    }).length;
  }, [deviceInfo]);

  const handleSearchDevice = async () => {
    if (!searchDeviceId.trim()) {
      toast({
        title: "请输入设备ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/admin/devices/${encodeURIComponent(searchDeviceId)}`);
      const result = await response.json();

      if (result.success) {
        setDeviceInfo(result.data);
        toast({
          title: "查询成功",
          description: `已获取设备 ${searchDeviceId} 的激活信息`,
          variant: "success",
        });
      } else {
        toast({
          title: "查询失败",
          description: result.message,
          variant: "destructive",
        });
        setDeviceInfo(null);
      }
    } catch (error) {
      toast({
        title: "查询失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
      setDeviceInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDevice = async () => {
    if (!deviceInfo) return;

    setIsResetting(true);
    try {
      const response = await fetch(`/api/admin/devices/${encodeURIComponent(deviceInfo.device_id)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "重置成功",
          description: result.message,
          variant: "success",
        });
        setResetDialogOpen(false);
        await handleSearchDevice();
      } else {
        toast({
          title: "重置失败",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "重置失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="data-kicker">设备管理</div>
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em]">设备管理</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                查询设备激活状态、查看历史记录，并在必要时释放有效激活码。
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b border-border/70 pb-5">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              设备查询
            </CardTitle>
            <CardDescription>输入设备标识后，查看当前状态和历史记录。</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="deviceId">设备标识</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="deviceId"
                    placeholder="输入设备ID"
                    value={searchDeviceId}
                    onChange={(e) => setSearchDeviceId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchDevice()}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button onClick={handleSearchDevice} disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Clock3 className="mr-2 h-4 w-4 animate-spin" />
                    查询中
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    查询设备
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {deviceInfo ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b border-border/70 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        设备信息
                      </CardTitle>
                      <CardDescription>设备当前状态与基础信息</CardDescription>
                    </div>

                    {deviceInfo.is_activated ? (
                      <Button variant="destructive" size="sm" onClick={() => setResetDialogOpen(true)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        重置激活
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="rounded-[1.4rem] border border-border/70 bg-background/72 p-4">
                    <div className="data-kicker">设备标识</div>
                    <div className="mt-3 display-code text-sm font-semibold tracking-[0.02em] break-all">
                      {deviceInfo.device_id}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/72 p-4">
                      <div className="data-kicker">当前状态</div>
                      <div className="mt-3">{getDeviceStatusBadge(deviceInfo)}</div>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/72 p-4">
                      <div className="data-kicker">激活次数</div>
                      <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                        {deviceInfo.total_activations}
                      </div>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/72 p-4">
                      <div className="data-kicker">有效记录</div>
                      <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                        {activeHistoryCount}
                      </div>
                    </div>
                  </div>

                  {deviceInfo.current_activation ? (
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/72 p-5">
                      <div className="data-kicker">当前激活码</div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge variant="default" className="px-3 tracking-[0.08em]">当前有效</Badge>
                        {getTypeBadge(deviceInfo.current_activation)}
                      </div>
                      <div className="mt-4 display-code text-sm font-semibold tracking-[0.02em]">
                        {deviceInfo.current_activation.code}
                      </div>
                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">激活时间</dt>
                          <dd className="text-right text-foreground">{deviceInfo.current_activation.used_at || "-"}</dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">到期时间</dt>
                          <dd className="text-right text-foreground">{deviceInfo.current_activation.expires_at || "永不过期"}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}

                  {deviceInfo.total_activations > 1 && deviceInfo.is_activated ? (
                    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-900" />
                        <div>
                          <div className="font-medium text-amber-900">检测到多次激活记录</div>
                          <div className="mt-1 text-sm leading-6 text-amber-900/80">
                            该设备存在多条历史激活记录。若用户反馈异常，请先核对当前有效激活码，再决定是否执行重置。
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="border-b border-border/70 pb-5">
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  激活历史
                </CardTitle>
                <CardDescription>该设备关联的全部激活记录</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {deviceInfo.activation_history.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                    当前没有历史记录。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deviceInfo.activation_history.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 space-y-3">
                            <div className="display-code text-sm font-semibold tracking-[0.02em]">
                              {record.code}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {getHistoryStatusBadge(record)}
                              {getTypeBadge(record)}
                            </div>
                          </div>

                          <div className="shrink-0 text-sm text-muted-foreground md:text-right">
                            <div>使用时间：{record.used_at || "-"}</div>
                            <div className="mt-1">到期时间：{record.expires_at || "永不过期"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : hasSearched && !isLoading ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <XCircle className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <div className="mt-4 text-base font-medium text-foreground">未找到设备记录</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  请确认设备标识是否正确，或稍后重试。
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <ActionConfirmDialog
          open={resetDialogOpen}
          onOpenChange={setResetDialogOpen}
          tone="danger"
          icon={isResetting ? <RotateCcw className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
          title="重置设备激活状态"
          description="确认后将释放该设备当前仍有效的激活码。历史已过期记录会保留。该操作无法撤销。"
          confirmText={isResetting ? "重置中..." : "确认重置"}
          pending={isResetting}
          disabled={!deviceInfo}
          onConfirm={handleResetDevice}
          summary={
            deviceInfo ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="data-kicker text-destructive/80">目标设备</div>
                  <div className="mt-3 display-code text-sm font-semibold tracking-[0.02em] text-destructive break-all">
                    {deviceInfo.device_id}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-card/78 p-4">
                    <div className="data-kicker">当前状态</div>
                    <div className="mt-3">{getDeviceStatusBadge(deviceInfo)}</div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/78 p-4">
                    <div className="data-kicker">激活次数</div>
                    <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                      {deviceInfo.total_activations}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                    <div className="data-kicker text-destructive/80">将释放</div>
                    <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-destructive">
                      {deviceInfo.is_activated ? 1 : 0}
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          }
          details={
            <div className="rounded-2xl border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
              重置后，该设备当前有效的激活码将恢复为未使用状态，设备绑定和使用时间会被清除。
            </div>
          }
        />
      </div>
    </AdminLayout>
  );
}
