"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Clock,
  CheckCircle,
  Copy,
  AlertCircle,
  Calendar,
  CalendarDays,
  Infinity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedCode {
  id: number;
  code: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function GeneratePage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [formData, setFormData] = useState({
    quantity: "10",
    expiryType: "never", // never, daily, monthly, custom
    expiryDateTime: "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // 当切换到自定义时间类型时，如果没有设置时间，则默认设置为明天23:59
      if (name === "expiryType" && value === "custom" && !prev.expiryDateTime) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 0, 0);
        updated.expiryDateTime = tomorrow.toISOString().slice(0, 16);
      }

      return updated;
    });
  };

  // 使用工具函数生成激活码

  const getExpiryConfig = (): { expires_at: Date | null; validity_days: number | null } => {
    if (formData.expiryType === "never") {
      return { expires_at: null, validity_days: null };
    }

    if (formData.expiryType === "daily") {
      // 日卡：激活后 1 天有效
      return { expires_at: null, validity_days: 1 };
    }

    if (formData.expiryType === "monthly") {
      // 月卡：激活后 30 天有效
      return { expires_at: null, validity_days: 30 };
    }

    if (formData.expiryType === "custom" && formData.expiryDateTime) {
      // 自定义：绝对过期时间
      return { expires_at: new Date(formData.expiryDateTime), validity_days: null };
    }

    return { expires_at: null, validity_days: null };
  };

  const validateForm = (): string | null => {
    const quantity = parseInt(formData.quantity);

    if (isNaN(quantity) || quantity < 1) {
      return "生成数量必须是大于0的整数";
    }

    if (quantity > 1000) {
      return "单次最多只能生成1000个激活码";
    }

    if (formData.expiryType === "custom") {
      if (!formData.expiryDateTime) {
        return "请选择过期日期和时间";
      }
      const selectedDateTime = new Date(formData.expiryDateTime);
      const now = new Date();

      if (selectedDateTime <= now) {
        return "过期时间必须是未来的时间";
      }
    }

    return null;
  };

  const handleGenerate = async () => {
    // 验证表单
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
      const quantity = parseInt(formData.quantity);
      const expiryConfig = getExpiryConfig();

      // 调用 API 生成激活码
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
        // API 已返回格式化的日期，直接使用
        const newCodes: GeneratedCode[] = result.data.codes.map(
          (code: any) => ({
            id: code.id,
            code: code.code,
            expiresAt: code.expires_at,
            createdAt: code.created_at,
          })
        );

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
      const allCodes = generatedCodes.map((item) => item.code).join("\n");
      await navigator.clipboard.writeText(allCodes);
      toast({
        title: "复制成功",
        description: `已复制 ${generatedCodes.length} 个激活码到剪贴板`,
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">生成激活码</h1>
          <p className="text-muted-foreground">
            批量生成新的激活码，支持自定义数量和过期时间
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 生成表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                生成设置
              </CardTitle>
              <CardDescription>配置要生成的激活码参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 数量设置 */}
              <div className="space-y-2">
                <Label htmlFor="quantity">生成数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                  placeholder="请输入生成数量"
                />
                <p className="text-xs text-muted-foreground">
                  建议单次生成不超过 1000 个激活码
                </p>
              </div>

              {/* 过期设置 */}
              <div className="space-y-4">
                <Label>有效期类型</Label>

                <Select
                  value={formData.expiryType}
                  onValueChange={(value) =>
                    handleInputChange("expiryType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择有效期类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                          <Infinity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">永久</div>
                          <div className="text-xs text-muted-foreground">永不过期</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="daily">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">日卡</div>
                          <div className="text-xs text-muted-foreground">激活后 24 小时有效</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100">
                          <CalendarDays className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">月卡</div>
                          <div className="text-xs text-muted-foreground">激活后 30 天有效</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100">
                          <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium">指定时间</div>
                          <div className="text-xs text-muted-foreground">自定义过期时间</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* 显示当前选择的说明 */}
                {formData.expiryType === "never" && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                      <Infinity className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>激活码永久有效，不会过期</span>
                    </p>
                  </div>
                )}

                {formData.expiryType === "daily" && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>日卡：激活后 24 小时有效</span>
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-2 ml-6">
                      • 生成后可随时激活，激活时刻开始计时<br />
                      • 例如：2024-01-15 10:30 激活 → 2024-01-16 10:30 过期
                    </p>
                  </div>
                )}

                {formData.expiryType === "monthly" && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100 flex items-start gap-2">
                      <CalendarDays className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>月卡：激活后 30 天有效</span>
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-2 ml-6">
                      • 生成后可随时激活，激活时刻开始计时<br />
                      • 例如：2024-01-01 10:30 激活 → 2024-01-31 10:30 过期
                    </p>
                  </div>
                )}

                {formData.expiryType === "custom" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDateTime" className="text-sm font-medium">
                        选择过期时间
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="expiryDateTime"
                          type="datetime-local"
                          value={formData.expiryDateTime}
                          onChange={(e) =>
                            handleInputChange("expiryDateTime", e.target.value)
                          }
                          min={new Date().toISOString().slice(0, 16)}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>

                    {/* 时间快捷设置 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">快捷选择</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(23, 59, 0, 0);
                            handleInputChange("expiryDateTime", tomorrow.toISOString().slice(0, 16));
                          }}
                          className="text-xs justify-start"
                        >
                          <Calendar className="mr-2 h-3 w-3" />
                          明天 23:59
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const nextWeek = new Date();
                            nextWeek.setDate(nextWeek.getDate() + 7);
                            nextWeek.setHours(23, 59, 0, 0);
                            handleInputChange("expiryDateTime", nextWeek.toISOString().slice(0, 16));
                          }}
                          className="text-xs justify-start"
                        >
                          <CalendarDays className="mr-2 h-3 w-3" />
                          7天后 23:59
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const threeMonths = new Date();
                            threeMonths.setMonth(threeMonths.getMonth() + 3);
                            threeMonths.setHours(23, 59, 0, 0);
                            handleInputChange("expiryDateTime", threeMonths.toISOString().slice(0, 16));
                          }}
                          className="text-xs justify-start"
                        >
                          <CalendarDays className="mr-2 h-3 w-3" />
                          3个月后 23:59
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const nextYear = new Date();
                            nextYear.setFullYear(nextYear.getFullYear() + 1);
                            nextYear.setHours(23, 59, 0, 0);
                            handleInputChange("expiryDateTime", nextYear.toISOString().slice(0, 16));
                          }}
                          className="text-xs justify-start"
                        >
                          <CalendarDays className="mr-2 h-3 w-3" />
                          1年后 23:59
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-sm text-orange-900 dark:text-orange-100 flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>激活码将在指定的时间点过期（无论是否激活）</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 生成按钮 */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.quantity}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    生成中... ({generatedCodes.length}/{formData.quantity})
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    开始生成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 生成结果 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  生成结果
                </div>
                {generatedCodes.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCopyAll}>
                      <Copy className="mr-2 h-4 w-4" />
                      复制全部
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {generatedCodes.length > 0
                  ? `成功生成 ${generatedCodes.length} 个激活码`
                  : "生成的激活码将在这里显示"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedCodes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>还没有生成任何激活码</p>
                  <p className="text-sm">请在左侧配置参数后点击生成</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generatedCodes.map((item) => {
                    // 根据生成时的类型显示不同的有效期信息
                    let expiryInfo = "";
                    let expiryIcon = null;

                    if (formData.expiryType === "never") {
                      expiryInfo = "永久有效";
                      expiryIcon = <Infinity className="h-3 w-3 mr-1 inline" />;
                    } else if (formData.expiryType === "daily") {
                      expiryInfo = "日卡 - 激活后 24 小时有效";
                      expiryIcon = <Calendar className="h-3 w-3 mr-1 inline" />;
                    } else if (formData.expiryType === "monthly") {
                      expiryInfo = "月卡 - 激活后 30 天有效";
                      expiryIcon = <CalendarDays className="h-3 w-3 mr-1 inline" />;
                    } else if (formData.expiryType === "custom" && item.expiresAt) {
                      expiryInfo = `过期时间: ${item.expiresAt}`;
                      expiryIcon = <Clock className="h-3 w-3 mr-1 inline" />;
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="space-y-1">
                          <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                            {item.code}
                          </code>
                          <p className="text-xs text-muted-foreground flex items-center">
                            {expiryIcon}
                            {expiryInfo}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(item.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 使用提示 */}
        {generatedCodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">使用说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">保存激活码</h4>
                  <p className="text-sm text-muted-foreground">
                    生成的激活码已自动保存到数据库，您可以在"激活码管理"页面查看和管理。
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">分发激活码</h4>
                  <p className="text-sm text-muted-foreground">
                    可以通过复制或导出功能获取激活码，然后分发给最终用户。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
