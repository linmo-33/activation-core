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
import { Plus, Clock, CheckCircle, Copy, AlertCircle } from "lucide-react";
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
    expiryType: "never", // never, days, date, datetime
    expiryDays: "30",
    expiryDate: "",
    expiryDateTime: "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      
      // 当切换到datetime类型时，如果没有设置时间，则默认设置为明天00:00:00
      if (name === "expiryType" && value === "datetime" && !prev.expiryDateTime) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        updated.expiryDateTime = tomorrow.toISOString().slice(0, 16);
      }
      
      return updated;
    });
  };

  // 使用工具函数生成激活码

  const calculateExpiryDate = (): Date | null => {
    if (formData.expiryType === "never") return null;

    if (formData.expiryType === "days") {
      const days = parseInt(formData.expiryDays);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      return expiryDate;
    }

    if (formData.expiryType === "date" && formData.expiryDate) {
      return new Date(formData.expiryDate + "T23:59:59");
    }

    if (formData.expiryType === "datetime" && formData.expiryDateTime) {
      return new Date(formData.expiryDateTime);
    }

    return null;
  };

  const validateForm = (): string | null => {
    const quantity = parseInt(formData.quantity);

    if (isNaN(quantity) || quantity < 1) {
      return "生成数量必须是大于0的整数";
    }

    if (quantity > 1000) {
      return "单次最多只能生成1000个激活码";
    }

    if (formData.expiryType === "days") {
      const days = parseInt(formData.expiryDays);
      if (isNaN(days) || days < 1) {
        return "过期天数必须是大于0的整数";
      }
      if (days > 3650) {
        return "过期天数不能超过10年(3650天)";
      }
    }

    if (formData.expiryType === "date") {
      if (!formData.expiryDate) {
        return "请选择过期日期";
      }
      const selectedDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate <= today) {
        return "过期日期必须是未来的日期";
      }
    }

    if (formData.expiryType === "datetime") {
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
      const expiresAt = calculateExpiryDate();

      // 调用 API 生成激活码
      const response = await fetch("/api/admin/codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
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
                <Label>过期时间设置</Label>

                <Select
                  value={formData.expiryType}
                  onValueChange={(value) =>
                    handleInputChange("expiryType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择过期类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">永不过期</SelectItem>
                    <SelectItem value="days">指定天数后过期</SelectItem>
                    <SelectItem value="date">指定日期过期(23:59:59)</SelectItem>
                    <SelectItem value="datetime">指定精确时间过期</SelectItem>
                  </SelectContent>
                </Select>

                {formData.expiryType === "days" && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      max="3650"
                      value={formData.expiryDays}
                      onChange={(e) =>
                        handleInputChange("expiryDays", e.target.value)
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      天后过期
                    </span>
                  </div>
                )}

                {formData.expiryType === "date" && (
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        handleInputChange("expiryDate", e.target.value)
                      }
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-muted-foreground">
                      将在选择日期的 23:59:59 过期
                    </p>
                  </div>
                )}

                {formData.expiryType === "datetime" && (
                  <div className="space-y-3">
                    <Input
                      type="datetime-local"
                      value={formData.expiryDateTime}
                      onChange={(e) =>
                        handleInputChange("expiryDateTime", e.target.value)
                      }
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    
                    {/* 时间快捷设置 */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (formData.expiryDateTime) {
                            const date = formData.expiryDateTime.split('T')[0];
                            handleInputChange("expiryDateTime", `${date}T00:00`);
                          }
                        }}
                        disabled={!formData.expiryDateTime}
                        className="text-xs"
                      >
                        00:00:00
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (formData.expiryDateTime) {
                            const date = formData.expiryDateTime.split('T')[0];
                            handleInputChange("expiryDateTime", `${date}T23:59`);
                          }
                        }}
                        disabled={!formData.expiryDateTime}
                        className="text-xs"
                      >
                        23:59:59
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      支持精确设置过期时间，可使用按钮快速设置为当天开始或结束时间
                    </p>
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
                  {generatedCodes.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="space-y-1">
                        <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                          {item.code}
                        </code>
                        <p className="text-xs text-muted-foreground">
                          {item.expiresAt
                            ? `过期时间: ${item.expiresAt}`
                            : "永不过期"}
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
                  ))}
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
