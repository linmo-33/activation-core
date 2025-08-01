"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Trash2,
  Loader2,
  Database,
  Clock,
  CheckCircle,
} from "lucide-react";

interface CleanupStats {
  expired_count: number;
  total_expired: number;
  total_codes: number;
  unused_codes: number;
  used_codes: number;
}

interface CleanupExpiredCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleanupComplete?: () => void;
}

export function CleanupExpiredCodesDialog({
  open,
  onOpenChange,
  onCleanupComplete,
}: CleanupExpiredCodesDialogProps) {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { toast } = useToast();

  // 获取清理统计信息
  const fetchCleanupStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/admin/codes/cleanup");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // 映射 API 返回的数据结构到组件期望的格式
          const cleanStats: CleanupStats = {
            expired_count: result.data.cleanable_expired || 0,
            total_expired: result.data.total_expired || 0,
            total_codes: result.data.database_stats?.total_codes || 0,
            unused_codes: result.data.database_stats?.unused_codes || 0,
            used_codes: result.data.database_stats?.used_codes || 0,
          };
          setStats(cleanStats);
        }
      }
    } catch (error) {
      console.error("获取清理统计失败:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // 执行清理操作
  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const response = await fetch("/api/admin/codes/cleanup", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "清理完成",
          description: `已成功清理 ${result.data?.cleaned || 0} 个过期激活码`,
        });
        onOpenChange(false);
        onCleanupComplete?.();
      } else {
        toast({
          title: "清理失败",
          description: result.message || "清理操作失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "清理失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // 当弹窗打开时获取统计信息
  useEffect(() => {
    if (open) {
      fetchCleanupStats();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Trash2 className="mr-2 h-5 w-5 text-destructive" />
            清理过期激活码
          </DialogTitle>
          <DialogDescription>
            此操作将永久删除所有过期且未使用的激活码，无法撤销。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 统计信息 */}
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                正在统计数据...
              </span>
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">总激活码</div>
                    <div className="text-lg font-bold">
                      {(stats.total_codes || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium">总过期数</div>
                    <div className="text-lg font-bold text-orange-600">
                      {(stats.total_expired || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 清理目标 */}
              <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">
                      将要清理的激活码
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {(stats.expired_count || 0).toLocaleString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  仅清理过期且未使用的激活码，已使用的过期激活码将保留
                </p>
              </div>

              {/* 操作说明 */}
              {(stats.expired_count || 0) > 0 && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• 此操作将释放数据库存储空间</p>
                  <p>• 清理后无法恢复被删除的激活码</p>
                  <p>• 建议在系统维护期间执行此操作</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              获取统计信息失败
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCleaningUp}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleCleanup}
            disabled={
              isLoadingStats ||
              isCleaningUp ||
              !stats ||
              (stats.expired_count || 0) === 0
            }
          >
            {isCleaningUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                清理中...
              </>
            ) : (stats?.expired_count || 0) === 0 ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                无需清理
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                确认清理
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
