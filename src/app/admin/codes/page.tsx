"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckSquare,
  Copy,
  Filter,
  Infinity,
  Key,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Square,
  Ticket,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import { ActionConfirmDialog } from "@/components/admin/action-confirm-dialog";
import { CleanupExpiredCodesDialog } from "@/components/admin/cleanup-expired-codes-dialog";
import { DataTableWorkbench } from "@/components/admin/data-table-workbench";
import { cn } from "@/lib/utils";
import { getActivationCodeTypeMeta } from "@/lib/activation-code-type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ActivationCode {
  id: number;
  code: string;
  status: "unused" | "used";
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_by_device_id: string | null;
  validity_days: number | null;
}

function getStatusBadge(status: ActivationCode["status"]) {
  if (status === "used") {
    return (
      <Badge variant="default" className="px-3 tracking-[0.08em]">
        已使用
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="px-3 tracking-[0.08em]">
      未使用
    </Badge>
  );
}

function getValidityBadge(code: ActivationCode) {
  const meta = getActivationCodeTypeMeta({
    validityDays: code.validity_days,
    expiresAt: code.expires_at,
  });

  const icon =
    meta.key === "permanent" ? (
      <Infinity className="mr-1 h-3 w-3" />
    ) : meta.key === "absolute_deadline" ? (
      <CalendarClock className="mr-1 h-3 w-3" />
    ) : meta.key === "relative_1d" || meta.key === "relative_30d" ? (
      <Calendar className="mr-1 h-3 w-3" />
    ) : (
      <Ticket className="mr-1 h-3 w-3" />
    );

  return (
    <Badge
      variant="outline"
      className={cn("px-3 tracking-[0.08em]", meta.badgeClassName)}
    >
      {icon}
      {meta.title}
    </Badge>
  );
}

function getExpiryDisplay(code: ActivationCode) {
  if (code.status === "unused" && code.validity_days) {
    return `激活后 ${code.validity_days} 天`;
  }

  if (code.expires_at) {
    return code.expires_at;
  }

  return "永不过期";
}

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
}

export default function CodesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCodes, setTotalCodes] = useState(0);
  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [pendingBatchAction, setPendingBatchAction] = useState<
    "delete" | "reset" | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchCodes();
  }, [statusFilter, searchTerm, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());

      const response = await fetch(`/api/admin/codes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCodes(data.data.codes);
        setTotalCodes(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("获取激活码列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const allSelected = codes.length > 0 && selectedCodes.length === codes.length;
  const pageItems = useMemo(
    () => buildPageItems(currentPage, totalPages),
    [currentPage, totalPages]
  );
  const selectionStats = useMemo(() => {
    return codes.reduce(
      (acc, code) => {
        if (!selectedCodes.includes(code.id)) {
          return acc;
        }

        acc.total += 1;
        if (code.status === "used") {
          acc.used += 1;
        } else {
          acc.unused += 1;
        }
        return acc;
      },
      { total: 0, used: 0, unused: 0 }
    );
  }, [codes, selectedCodes]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "复制成功",
        description: `激活码 ${code} 已复制到剪贴板`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板，请手动复制",
        variant: "destructive",
      });
    }
  };

  const handleResetCode = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/codes/${id}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        fetchCodes();
        toast({
          title: "重置成功",
          description: "激活码已重置为未使用状态",
          variant: "success",
        });
      } else {
        toast({
          title: "重置失败",
          description: result.message || "重置激活码失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("重置激活码失败:", error);
      toast({
        title: "重置失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedCodes([]);
      return;
    }

    setSelectedCodes(codes.map((code) => code.id));
  };

  const handleSelectCode = (id: number) => {
    setSelectedCodes((prev) =>
      prev.includes(id) ? prev.filter((codeId) => codeId !== id) : [...prev, id]
    );
  };

  const handleBatchOperation = async (action: "delete" | "reset") => {
    if (selectedCodes.length === 0) {
      toast({
        title: "请选择激活码",
        description: "请先选择要操作的激活码",
        variant: "warning",
      });
      return false;
    }

    setIsBatchProcessing(true);
    try {
      const response = await fetch("/api/admin/codes/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ids: selectedCodes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchCodes();
        setSelectedCodes([]);
        toast({
          title: "操作成功",
          description: result.message,
          variant: "success",
        });
        return true;
      } else {
        toast({
          title: "操作失败",
          description: result.message || "批量操作失败",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("批量操作失败:", error);
      toast({
        title: "操作失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const selectedCount = selectionStats.total;
  const selectedUsedCount = selectionStats.used;
  const selectedUnusedCount = selectionStats.unused;

  const batchDialogSummary = pendingBatchAction ? (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/78 p-4">
          <div className="data-kicker">已选记录</div>
          <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            {selectedCount}
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/78 p-4">
          <div className="data-kicker">已使用</div>
          <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            {selectedUsedCount}
          </div>
        </div>
        <div
          className={`rounded-2xl p-4 ${
            pendingBatchAction === "delete"
              ? "border border-destructive/20 bg-destructive/5"
              : "border border-border/70 bg-card/78"
          }`}
        >
          <div
            className={`data-kicker ${
              pendingBatchAction === "delete" ? "text-destructive/80" : ""
            }`}
          >
            {pendingBatchAction === "delete" ? "将删除" : "将重置"}
          </div>
          <div
            className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${
              pendingBatchAction === "delete" ? "text-destructive" : ""
            }`}
          >
            {selectedCount}
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl p-4 ${
          pendingBatchAction === "delete"
            ? "border border-destructive/20 bg-destructive/5"
            : "border border-border/70 bg-card/75"
        }`}
      >
        <div className="flex items-start gap-3">
          {pendingBatchAction === "delete" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          ) : (
            <RotateCcw className="mt-0.5 h-4 w-4 text-foreground" />
          )}
          <div>
            <div
              className={`font-medium ${
                pendingBatchAction === "delete"
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {pendingBatchAction === "delete"
                ? "批量删除后无法恢复"
                : "批量重置会释放已绑定的激活码"}
            </div>
            <div className="mt-1 text-sm leading-6 text-muted-foreground">
              {pendingBatchAction === "delete"
                ? "删除会永久移除所选激活码记录，请确认这些记录无需保留。"
                : "重置后，已使用的激活码会恢复为未使用状态，设备绑定和使用时间将被清除。"}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="data-kicker">激活码列表</div>
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em]">
                激活码管理
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                查看激活码状态、有效期类型和设备绑定情况。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchCodes} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新列表
            </Button>
            <Button asChild>
              <Link href="/admin/generate">
                <Plus className="mr-2 h-4 w-4" />
                生成激活码
              </Link>
            </Button>
          </div>
        </div>

        <DataTableWorkbench
          title="激活码表格"
          description={
            isLoading ? "正在加载激活码数据..." : "激活码数据加载完成"
          }
          toolbar={
            <div className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索激活码或设备标识"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-1 lg:flex lg:items-center">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="min-w-[170px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="状态筛选" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="unused">未使用</SelectItem>
                      <SelectItem value="used">已使用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/70 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedCodes.length > 0
                    ? `已选择 ${selectedCodes.length} 条记录`
                    : "可按状态筛选、搜索或批量处理已选记录"}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCleanupDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    清理过期
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setPendingBatchAction("reset")}
                    disabled={selectedCodes.length === 0 || isBatchProcessing}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    批量重置
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => setPendingBatchAction("delete")}
                    disabled={selectedCodes.length === 0 || isBatchProcessing}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    批量删除
                  </Button>
                </div>
              </div>
            </div>
          }
          content={
            <div className="space-y-4">
              <div className="hidden overflow-hidden rounded-[1.5rem] border border-border/70 lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/70 hover:bg-transparent">
                      <TableHead className="w-12">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAll}
                          className="h-8 w-8 p-0"
                        >
                          {allSelected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>激活码</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>有效期类型</TableHead>
                      <TableHead>过期时间</TableHead>
                      <TableHead>使用时间</TableHead>
                      <TableHead>设备ID</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-28 rounded bg-muted animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="ml-auto h-8 w-8 rounded bg-muted animate-pulse" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : codes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <Key className="h-10 w-10 opacity-40" />
                            <div>
                              <div className="text-base font-medium text-foreground">
                                暂无激活码
                              </div>
                              <div className="mt-1 text-sm">
                                {searchTerm || statusFilter !== "all"
                                  ? "请调整搜索条件或筛选项。"
                                  : "请先生成新的激活码。"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      codes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectCode(code.id)}
                              className="h-8 w-8 p-0"
                            >
                              {selectedCodes.includes(code.id) ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="display-code text-sm font-semibold tracking-[0.02em]">
                              {code.code}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              创建于 {code.created_at}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(code.status)}</TableCell>
                          <TableCell>{getValidityBadge(code)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getExpiryDisplay(code)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {code.used_at || "-"}
                          </TableCell>
                          <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                            <span className="truncate">
                              {code.used_by_device_id || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleCopyCode(code.code)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  复制激活码
                                </DropdownMenuItem>
                                {code.status === "used" ? (
                                  <DropdownMenuItem
                                    onClick={() => handleResetCode(code.id)}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    重置激活码
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 lg:hidden">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4"
                    >
                      <div className="h-5 w-28 rounded bg-muted animate-pulse" />
                      <div className="mt-4 h-4 w-24 rounded bg-muted animate-pulse" />
                      <div className="mt-2 h-4 w-32 rounded bg-muted animate-pulse" />
                    </div>
                  ))
                ) : codes.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    当前没有符合条件的激活码记录。
                  </div>
                ) : (
                  codes.map((code) => (
                    <div
                      key={code.id}
                      className="rounded-[1.4rem] border border-border/70 bg-background/78 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="display-code text-sm font-semibold tracking-[0.02em]">
                            {code.code}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            创建于 {code.created_at}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectCode(code.id)}
                          className="h-8 w-8 shrink-0 p-0"
                        >
                          {selectedCodes.includes(code.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {getStatusBadge(code.status)}
                        {getValidityBadge(code)}
                      </div>

                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">过期时间</dt>
                          <dd className="text-right text-foreground">
                            {getExpiryDisplay(code)}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">使用时间</dt>
                          <dd className="text-right text-foreground">
                            {code.used_at || "-"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">设备标识</dt>
                          <dd className="max-w-[60%] break-all text-right text-foreground">
                            {code.used_by_device_id || "-"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          复制
                        </Button>
                        {code.status === "used" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetCode(code.id)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            重置
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          }
          footer={
            !isLoading && totalCodes > 0 ? (
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="text-sm text-muted-foreground">
                  显示第 {(currentPage - 1) * pageSize + 1} -{" "}
                  {Math.min(currentPage * pageSize, totalCodes)} 条，共{" "}
                  {totalCodes} 条
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
                  <div className="flex items-center gap-3">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="min-w-[132px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 条</SelectItem>
                        <SelectItem value="20">20 条</SelectItem>
                        <SelectItem value="50">50 条</SelectItem>
                        <SelectItem value="100">100 条</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Pagination className="mx-0 w-auto justify-start">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                          }
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>

                      {pageItems.map((item, index) => (
                        <PaginationItem key={`${item}-${index}`}>
                          {item === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              isActive={currentPage === item}
                              onClick={() => setCurrentPage(item)}
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.min(Math.max(totalPages, 1), page + 1)
                            )
                          }
                          disabled={
                            currentPage === totalPages || totalPages === 0
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            ) : null
          }
        />

        <CleanupExpiredCodesDialog
          open={cleanupDialogOpen}
          onOpenChange={setCleanupDialogOpen}
          onCleanupComplete={() => {
            fetchCodes();
          }}
        />

        <ActionConfirmDialog
          open={pendingBatchAction !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPendingBatchAction(null);
            }
          }}
          tone={pendingBatchAction === "delete" ? "danger" : "neutral"}
          icon={
            isBatchProcessing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : pendingBatchAction === "delete" ? (
              <Trash2 className="h-5 w-5" />
            ) : (
              <RotateCcw className="h-5 w-5" />
            )
          }
          title={
            pendingBatchAction === "delete"
              ? "批量删除激活码"
              : "批量重置激活码"
          }
          description={
            pendingBatchAction === "delete"
              ? "确认后将永久删除当前选中的激活码记录。该操作无法撤销。"
              : "确认后将重置当前选中的激活码记录，已绑定设备的信息会被清除。"
          }
          confirmText={
            isBatchProcessing
              ? "处理中..."
              : pendingBatchAction === "delete"
              ? "确认删除"
              : "确认重置"
          }
          pending={isBatchProcessing}
          disabled={!pendingBatchAction || selectedCount === 0}
          onConfirm={() => {
            if (pendingBatchAction) {
              handleBatchOperation(pendingBatchAction).then((success) => {
                if (success) {
                  setPendingBatchAction(null);
                }
              });
            }
          }}
          summary={batchDialogSummary}
          details={
            pendingBatchAction === "reset" ? (
              <div className="rounded-2xl border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
                当前选中记录中，已使用 {selectedUsedCount} 条，未使用{" "}
                {selectedUnusedCount} 条。重置仅会影响已使用的记录。
              </div>
            ) : null
          }
        />
      </div>
    </AdminLayout>
  );
}
