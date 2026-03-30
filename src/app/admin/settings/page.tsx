"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Save,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "密码确认失败",
        description: "新密码和确认密码不匹配",
        variant: "warning",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "密码强度不足",
        description: "新密码长度至少为 6 个字符",
        variant: "warning",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "密码修改成功",
          description: "管理员密码已更新",
          variant: "success",
        });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast({
          title: "密码修改失败",
          description: result.message || "请检查当前密码是否正确",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "修改失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="data-kicker">账号与安全</div>
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em]">系统设置</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                修改管理员密码。
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl">
          <Card>
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                修改密码
              </CardTitle>
              <CardDescription>更新管理员账号密码。</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                      className="pr-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-9 w-9 rounded-lg text-muted-foreground"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                      className="pr-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-9 w-9 rounded-lg text-muted-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="rounded-[1.4rem] border border-border/70 bg-background/72 p-4 text-sm leading-6 text-muted-foreground">
                  新密码长度至少 6 位。修改成功后，新的登录凭据会立即生效。
                </div>

                <div className="flex justify-end border-t border-border/70 pt-5">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "修改中..." : "保存新密码"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
