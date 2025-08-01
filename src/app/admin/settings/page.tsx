"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout-client";
import { CleanupExpiredCodesDialog } from "@/components/admin/cleanup-expired-codes-dialog";
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

import { useToast } from "@/hooks/use-toast";
import { Lock, AlertTriangle, Save, Eye, EyeOff, Settings } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // 密码修改表单
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
        description: "新密码长度至少为6个字符",
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

  const handleDatabaseCleanup = () => {
    setCleanupDialogOpen(true);
  };

  const handleCleanupComplete = () => {
    // 清理完成后的回调，可以在这里刷新其他数据
    console.log("清理操作完成");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
          <p className="text-muted-foreground">
            管理系统配置、安全设置和维护操作
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 密码修改 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                修改密码
              </CardTitle>
              <CardDescription>更改管理员账户密码</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
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
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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

                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "修改中..." : "修改密码"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 系统维护 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                系统维护
              </CardTitle>
              <CardDescription>数据库清理和维护操作</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>数据库清理</Label>
                <p className="text-sm text-muted-foreground">
                  清理过期的激活码以释放存储空间
                </p>
                <Button
                  variant="outline"
                  onClick={handleDatabaseCleanup}
                  disabled={isLoading}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  清理过期数据
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 清理过期激活码弹窗 */}
      <CleanupExpiredCodesDialog
        open={cleanupDialogOpen}
        onOpenChange={setCleanupDialogOpen}
        onCleanupComplete={handleCleanupComplete}
      />
    </AdminLayout>
  );
}
