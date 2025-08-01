"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import { CleanupExpiredCodesDialog } from "@/components/admin/cleanup-expired-codes-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Copy,
  RotateCcw,
  Trash2,
  CheckSquare,
  Square,
  Key,
  Plus,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface ActivationCode {
  id: number;
  code: string;
  status: "unused" | "used";
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_by_device_id: string | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "unused":
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          未使用
        </Badge>
      );
    case "used":
      return <Badge variant="secondary">已使用</Badge>;
    case "expired":
      return <Badge variant="destructive">已过期</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
};

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

  useEffect(() => {
    fetchCodes();
  }, [statusFilter, searchTerm]);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);
      params.append("limit", "50");

      const response = await fetch(`/api/admin/codes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCodes(data.data.codes);
        setTotalCodes(data.data.pagination.total);
      }
    } catch (error) {
      console.error("获取激活码列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 移除客户端过滤，因为已经在服务端过滤了
  const filteredCodes = codes;

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
        // 重置成功，刷新列表
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

  // 批量操作函数
  const handleSelectAll = () => {
    if (selectedCodes.length === codes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(codes.map((code) => code.id));
    }
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
      return;
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
      } else {
        toast({
          title: "操作失败",
          description: result.message || "批量操作失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("批量操作失败:", error);
      toast({
        title: "操作失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">激活码管理</h1>
            <p className="text-muted-foreground">查看和管理所有激活码的状态</p>
          </div>
          <div className="flex items-center space-x-2">
            {selectedCodes.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleBatchOperation("reset")}
                  disabled={isBatchProcessing}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  批量重置 ({selectedCodes.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleBatchOperation("delete")}
                  disabled={isBatchProcessing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  批量删除 ({selectedCodes.length})
                </Button>
              </>
            )}

            <Button onClick={fetchCodes} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>

            <Button
              variant="outline"
              onClick={() => setCleanupDialogOpen(true)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              清理过期
            </Button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">筛选和搜索</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索激活码或设备ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="unused">未使用</SelectItem>
                  <SelectItem value="used">已使用</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 激活码列表 */}
        <Card>
          <CardHeader>
            <CardTitle>激活码列表</CardTitle>
            <CardDescription>
              {isLoading ? "加载中..." : `共找到 ${totalCodes} 个激活码`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-8 w-8 p-0"
                      >
                        {selectedCodes.length === codes.length &&
                        codes.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>激活码</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>过期时间</TableHead>
                    <TableHead>使用时间</TableHead>
                    <TableHead>设备ID</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : filteredCodes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <Key className="h-12 w-12 text-muted-foreground/50" />
                          <div>
                            <p className="text-lg font-medium">
                              暂无激活码数据
                            </p>
                            <p className="text-sm">
                              {searchTerm || statusFilter !== "all"
                                ? "尝试调整搜索条件或筛选器"
                                : "开始生成您的第一个激活码"}
                            </p>
                          </div>
                          {!searchTerm && statusFilter === "all" && (
                            <Button asChild>
                              <Link href="/admin/generate">
                                <Plus className="mr-2 h-4 w-4" />
                                生成激活码
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCodes.map((code) => (
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
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {code.code}
                          </code>
                        </TableCell>
                        <TableCell>{getStatusBadge(code.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {code.created_at || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {code.expires_at || "永不过期"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {code.used_at || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {code.used_by_device_id || "-"}
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
                              {code.status === "used" && (
                                <DropdownMenuItem
                                  onClick={() => handleResetCode(code.id)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  重置激活码
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 清理过期激活码弹窗 */}
      <CleanupExpiredCodesDialog
        open={cleanupDialogOpen}
        onOpenChange={setCleanupDialogOpen}
        onCleanupComplete={() => {
          // 清理完成后刷新列表
          fetchCodes();
        }}
      />
    </AdminLayout>
  );
}
