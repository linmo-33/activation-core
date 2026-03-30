"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock3, Database, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ActionConfirmDialog } from "@/components/admin/action-confirm-dialog";

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

  const fetchCleanupStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch("/api/admin/codes/cleanup");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats({
            expired_count: result.data.cleanable_expired || 0,
            total_expired: result.data.total_expired || 0,
            total_codes: result.data.database_stats?.total_codes || 0,
            unused_codes: result.data.database_stats?.unused_codes || 0,
            used_codes: result.data.database_stats?.used_codes || 0,
          });
        }
      }
    } catch (error) {
      console.error("获取清理统计失败:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

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
          variant: "success",
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

  useEffect(() => {
    if (open) {
      fetchCleanupStats();
    }
  }, [open]);

  const summary = isLoadingStats ? (
    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      正在统计待清理记录...
    </div>
  ) : stats ? (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/78 p-4">
          <div className="data-kicker">总记录</div>
          <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            {stats.total_codes.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/78 p-4">
          <div className="data-kicker">总过期</div>
          <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            {stats.total_expired.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="data-kicker text-destructive/80">待清理</div>
          <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-destructive">
            {stats.expired_count.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <div className="font-medium text-destructive">将永久删除过期且未使用的激活码</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">
                已使用的过期激活码不会被删除，当前仅清理可安全移除的库存记录。
              </div>
            </div>
          </div>
          <Badge variant="destructive" className="px-3 tracking-[0.08em]">
            {stats.expired_count}
          </Badge>
        </div>
      </div>
    </div>
  ) : (
    <div className="py-10 text-center text-sm text-muted-foreground">获取统计信息失败</div>
  );

  const details = stats && !isLoadingStats ? (
    <>
      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/75 p-4">
        <Database className="mt-0.5 h-4 w-4 text-foreground" />
        <div>
          <div className="font-medium text-foreground">库存影响</div>
          <div className="mt-1 leading-6">
            当前未使用激活码 {stats.unused_codes.toLocaleString()} 个，已使用激活码 {stats.used_codes.toLocaleString()} 个。
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/75 p-4">
        <Clock3 className="mt-0.5 h-4 w-4 text-foreground" />
        <div>
          <div className="font-medium text-foreground">执行建议</div>
          <div className="mt-1 leading-6">
            建议在确认无需保留这些过期库存后执行。操作完成后无法恢复被删除的激活码。
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <ActionConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="danger"
      icon={
        isCleaningUp ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Trash2 className="h-5 w-5" />
        )
      }
      title="清理过期激活码"
      description="此操作将删除所有过期且未使用的激活码记录。该操作无法撤销。"
      confirmText={
        isCleaningUp
          ? "清理中..."
          : stats && stats.expired_count === 0
            ? "无需清理"
            : "确认清理"
      }
      pending={isCleaningUp}
      disabled={isLoadingStats || !stats || stats.expired_count === 0}
      onConfirm={handleCleanup}
      summary={summary}
      details={details}
    />
  );
}
