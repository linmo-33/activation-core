"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CalendarClock,
  Copy,
  Infinity,
  Loader2,
  Plus,
  Sparkles,
  Ticket,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  generateActivationCodeTypeOptions,
  type ActivationCodeTypeKey,
} from "@/lib/activation-code-type";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CodeType = Exclude<ActivationCodeTypeKey, "relative_nd">;

interface GeneratedCode {
  id: number;
  code: string;
  expiresAt: string | null;
  createdAt: string;
}

function getDefaultCustomDeadline() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);
  return tomorrow.toISOString().slice(0, 16);
}

export default function GeneratePage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [formData, setFormData] = useState({
    quantity: "10",
    codeType: "permanent" as CodeType,
    expiryDateTime: getDefaultCustomDeadline(),
  });

  const selectedType = useMemo(
    () => generateActivationCodeTypeOptions.find((item) => item.key === formData.codeType)!,
    [formData.codeType]
  );

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getExpiryConfig = (): { expires_at: Date | null; validity_days: number | null } => {
    switch (formData.codeType) {
      case "permanent":
        return { expires_at: null, validity_days: null };
      case "relative_1d":
        return { expires_at: null, validity_days: 1 };
      case "relative_30d":
        return { expires_at: null, validity_days: 30 };
      case "absolute_deadline":
        return { expires_at: new Date(formData.expiryDateTime), validity_days: null };
      default:
        return { expires_at: null, validity_days: null };
    }
  };

  const validateForm = (): string | null => {
    const quantity = parseInt(formData.quantity, 10);

    if (Number.isNaN(quantity) || quantity < 1) {
      return "生成数量必须是大于 0 的整数";
    }

    if (quantity > 1000) {
      return "单次最多只能生成 1000 个激活码";
    }

    if (formData.codeType === "absolute_deadline") {
      if (!formData.expiryDateTime) {
        return "请选择截止时间";
      }

      const selectedDateTime = new Date(formData.expiryDateTime);
      if (selectedDateTime <= new Date()) {
        return "截止时间必须晚于当前时间";
      }
    }

    return null;
  };

  const handleGenerate = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "输入验证失败",
        description: validationError,
        variant: "warning",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const quantity = parseInt(formData.quantity, 10);
      const expiryConfig = getExpiryConfig();

      const response = await fetch("/api/admin/codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
          expires_at: expiryConfig.expires_at ? expiryConfig.expires_at.toISOString() : null,
          validity_days: expiryConfig.validity_days,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const newCodes: GeneratedCode[] = result.data.codes.map((code: any) => ({
          id: code.id,
          code: code.code,
          expiresAt: code.expires_at,
          createdAt: code.created_at,
        }));

        setGeneratedCodes(newCodes);
        toast({
          title: "生成成功",
          description: `成功生成 ${newCodes.length} 个激活码`,
          variant: "success",
        });
      } else {
        toast({
          title: "生成失败",
          description: result.message || "生成激活码失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("生成激活码失败:", error);
      toast({
        title: "生成失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(generatedCodes.map((item) => item.code).join("\n"));
      toast({
        title: "复制成功",
        description: `已复制 ${generatedCodes.length} 个激活码`,
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

  const handleQuickDeadline = (days: number) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    nextDate.setHours(23, 59, 0, 0);
    handleFieldChange("expiryDateTime", nextDate.toISOString().slice(0, 16));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="data-kicker">激活码生成</div>
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em]">生成激活码</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                选择激活码类型、数量和有效期规则。
              </p>
            </div>
          </div>

          <Badge variant="outline" className="w-fit px-3 tracking-[0.08em]">
            当前类型：{selectedType.title}
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-border/70 pb-5">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  生成设置
                </CardTitle>
                <CardDescription>选择类型、数量和有效期规则。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {generateActivationCodeTypeOptions.map((item) => {
                    const active = formData.codeType === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleFieldChange("codeType", item.key)}
                        className={cn(
                          "rounded-[1.35rem] border p-4 text-left transition-all duration-200",
                          item.accentClassName,
                          active
                            ? "shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)] ring-2 ring-foreground/8"
                            : "opacity-92 hover:-translate-y-[1px]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="text-base font-semibold tracking-[-0.03em]">{item.title}</div>
                            <div className="text-xs font-medium">{item.subtitle}</div>
                          </div>
                          <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]", item.badgeClassName)}>
                            {active ? "已选中" : "可选择"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">生成数量</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.quantity}
                      onChange={(e) => handleFieldChange("quantity", e.target.value)}
                      placeholder="请输入生成数量"
                    />
                    <p className="text-xs leading-5 text-muted-foreground">建议单次不超过 1000 个。</p>
                  </div>

                  <div className="rounded-[1.35rem] border border-border/70 bg-background/72 p-4">
                    <div className="data-kicker">当前规则</div>
                    <div className="mt-3 flex items-center gap-2">
                      {formData.codeType === "permanent" ? <Infinity className="h-4 w-4" /> : null}
                      {formData.codeType === "relative_1d" ? <Calendar className="h-4 w-4" /> : null}
                      {formData.codeType === "relative_30d" ? <Ticket className="h-4 w-4" /> : null}
                      {formData.codeType === "absolute_deadline" ? <CalendarClock className="h-4 w-4" /> : null}
                      <div className="font-medium text-foreground">{selectedType.title}</div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {selectedType.description}
                    </p>
                  </div>
                </div>

                {formData.codeType === "absolute_deadline" ? (
                  <div className="space-y-4 rounded-[1.35rem] border border-amber-200 bg-amber-50/80 p-5">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDateTime">截止时间</Label>
                      <div className="relative">
                        <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="expiryDateTime"
                          type="datetime-local"
                          value={formData.expiryDateTime}
                          onChange={(e) => handleFieldChange("expiryDateTime", e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button type="button" variant="outline" size="sm" className="justify-start" onClick={() => handleQuickDeadline(1)}>
                        明天 23:59
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="justify-start" onClick={() => handleQuickDeadline(7)}>
                        7 天后 23:59
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="justify-start" onClick={() => handleQuickDeadline(30)}>
                        30 天后 23:59
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">生成后会立即写入数据库，并同步显示到右侧结果区。</div>
                  <Button onClick={handleGenerate} disabled={isGenerating || !formData.quantity} size="lg">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        正在生成
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        开始生成
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="min-h-0">
            <Card className="flex h-full max-h-[calc(100vh-220px)] min-h-[520px] flex-col">
              <CardHeader className="shrink-0 border-b border-border/70 pb-5">
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>生成结果</span>
                  {generatedCodes.length > 0 ? (
                    <Button variant="outline" size="sm" onClick={handleCopyAll}>
                      <Copy className="mr-2 h-4 w-4" />
                      复制全部
                    </Button>
                  ) : null}
                </CardTitle>
                <CardDescription>
                  {generatedCodes.length > 0
                    ? `本次已生成 ${generatedCodes.length} 个激活码`
                    : "生成后在这里查看和复制本次结果"}
                </CardDescription>
              </CardHeader>

              <CardContent className="min-h-0 flex-1 pt-6">
                {generatedCodes.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-[1.4rem] border border-dashed border-border p-10 text-left text-sm text-muted-foreground">
                    生成完成后，这里会展示本次生成的激活码列表。右侧面板内部可独立滚动。
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto pr-1">
                    <div className="space-y-3">
                      {generatedCodes.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-border/70 bg-background/75 p-4"
                        >
                          <div className="min-w-0 text-left">
                            <div className="display-code text-sm font-semibold tracking-[0.02em]">
                              {item.code}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formData.codeType === "absolute_deadline" && item.expiresAt
                                ? `截止时间：${item.expiresAt}`
                                : `创建时间：${item.createdAt}`}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(item.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
