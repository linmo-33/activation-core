"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Smartphone,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Calendar,
  Hash,
} from "lucide-react";

interface DeviceActivationInfo {
  device_id: string;
  is_activated: boolean;
  has_expired_activations?: boolean;
  current_activation?: {
    id: number;
    code: string;
    used_at: string;
    expires_at: string;
  };
  activation_history: Array<{
    id: number;
    code: string;
    status: string;
    used_at: string;
    expires_at: string;
  }>;
  total_activations: number;
}

export default function DevicesPage() {
  const { toast } = useToast();
  const [searchDeviceId, setSearchDeviceId] = useState("");
  const [deviceInfo, setDeviceInfo] = useState<DeviceActivationInfo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // 查询设备激活状态
  const handleSearchDevice = async () => {
    if (!searchDeviceId.trim()) {
      toast({
        title: "请输入设备ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/devices/${encodeURIComponent(searchDeviceId)}`
      );
      const result = await response.json();

      if (result.success) {
        setDeviceInfo(result.data);
        toast({
          title: "查询成功",
          description: `找到设备 ${searchDeviceId} 的激活信息`,
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

  // 打开重置确认弹窗
  const handleOpenResetDialog = () => {
    setResetDialogOpen(true);
  };

  // 重置设备激活状态
  const handleResetDevice = async () => {
    if (!deviceInfo) return;

    setResetDialogOpen(false);

    setIsResetting(true);
    try {
      const response = await fetch(
        `/api/admin/devices/${encodeURIComponent(deviceInfo.device_id)}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();

      if (result.success) {
        toast({
          title: "重置成功",
          description: result.message,
          variant: "success",
        });
        // 重新查询设备状态
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
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Smartphone className="mr-3 h-8 w-8" />
            设备管理
          </h1>
          <p className="text-muted-foreground mt-2">
            查询和管理设备激活状态，处理设备激活异常情况
          </p>
        </div>

        {/* 设备查询 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              设备查询
            </CardTitle>
            <CardDescription>输入设备ID查询激活状态和历史记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="deviceId">设备ID</Label>
                <Input
                  id="deviceId"
                  placeholder="输入设备ID..."
                  value={searchDeviceId}
                  onChange={(e) => setSearchDeviceId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchDevice()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearchDevice} disabled={isLoading}>
                  {isLoading ? "查询中..." : "查询"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 设备信息 */}
        {deviceInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Smartphone className="mr-2 h-5 w-5" />
                  设备信息
                </span>
                {deviceInfo.is_activated && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleOpenResetDialog}
                    disabled={isResetting}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {isResetting ? "重置中..." : "重置激活"}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">设备ID:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {deviceInfo.device_id}
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  {deviceInfo.is_activated ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">激活状态:</span>
                  <Badge
                    variant={deviceInfo.is_activated ? "default" : "secondary"}
                  >
                    {deviceInfo.is_activated ? "已激活" : "未激活"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">激活次数:</span>
                  <Badge variant="outline">
                    {deviceInfo.total_activations}
                  </Badge>
                </div>
              </div>

              {/* 当前激活信息 */}
              {deviceInfo.current_activation && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    当前激活码
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">激活码:</span>
                      <code className="ml-2 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                        {deviceInfo.current_activation.code}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">激活时间:</span>
                      <span className="ml-2">
                        {deviceInfo.current_activation.used_at || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 激活历史 */}
              {deviceInfo.activation_history.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">激活历史</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {deviceInfo.activation_history.map((activation, index) => {
                      const isExpired =
                        activation.expires_at &&
                        new Date(activation.expires_at) < new Date();
                      const isActive =
                        activation.status === "used" && !isExpired;

                      return (
                        <div
                          key={activation.id}
                          className="flex items-center justify-between p-3 border rounded-lg text-sm"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  isActive
                                    ? "default"
                                    : isExpired
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {activation.status === "used"
                                  ? isExpired
                                    ? "已过期"
                                    : "已使用"
                                  : "未使用"}
                              </Badge>
                              {isExpired && (
                                <Badge variant="outline" className="text-xs">
                                  过期
                                </Badge>
                              )}
                            </div>
                            <code className="bg-muted px-2 py-1 rounded">
                              {activation.code}
                            </code>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground">
                              {activation.used_at || "未使用"}
                            </div>
                            {activation.expires_at && (
                              <div
                                className={`text-xs ${
                                  isExpired
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                }`}
                              >
                                到期: {activation.expires_at}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 异常激活警告 */}
              {deviceInfo.total_activations > 1 && deviceInfo.is_activated && (
                <div className="flex items-start space-x-2 p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      检测到异常激活
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      该设备同时拥有多个有效激活码，这可能表示存在系统异常。
                      建议检查激活记录并考虑重置设备状态。
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 重置确认弹窗 */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                重置设备激活状态
              </DialogTitle>
              <DialogDescription>
                此操作将释放设备的有效激活码，过期的激活码将保留作为历史记录。
              </DialogDescription>
            </DialogHeader>

            {deviceInfo && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Smartphone className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">
                      目标设备
                    </span>
                  </div>
                  <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded">
                    {deviceInfo.device_id}
                  </code>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• 只释放该设备的有效激活码（未过期）</p>
                  <p>• 过期的激活码将保留作为历史记录</p>
                  <p>• 释放的激活码可以被其他设备使用</p>
                  <p>• 设备可以重新激活（使用新的激活码）</p>
                  <p>• 此操作无法撤销</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(false)}
                disabled={isResetting}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetDevice}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                    重置中...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    确认重置
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
