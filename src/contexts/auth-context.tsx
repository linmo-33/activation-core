"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, clearAuth } from "@/lib/auth-client";

interface UserInfo {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: UserInfo) => void;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 初始化认证状态
  const initAuth = () => {
    try {
      // 优先从 sessionStorage 获取用户信息
      const storedUser = sessionStorage.getItem("admin_user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } else {
        // 如果 sessionStorage 中没有，尝试从 cookie 获取（向后兼容）
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // 同时存储到 sessionStorage
          sessionStorage.setItem("admin_user", JSON.stringify(currentUser));
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("初始化认证状态失败:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = (userData: UserInfo) => {
    setUser(userData);
    // 将用户信息存储到 sessionStorage
    sessionStorage.setItem("admin_user", JSON.stringify(userData));
  };

  // 登出
  const logout = async () => {
    try {
      // 调用登出 API
      await fetch("/api/admin/login", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("登出 API 调用失败:", error);
    } finally {
      // 无论 API 是否成功，都清除本地认证信息
      clearAuth();
      // 清除 sessionStorage 中的用户信息
      sessionStorage.removeItem("admin_user");
      setUser(null);
      router.push("/admin/login");
      router.refresh();
    }
  };

  // 刷新认证状态
  const refreshAuth = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // 更新 sessionStorage
      sessionStorage.setItem("admin_user", JSON.stringify(currentUser));
    } else {
      // 清除 sessionStorage
      sessionStorage.removeItem("admin_user");
      router.push("/admin/login");
    }
  };

  // 组件挂载时初始化
  useEffect(() => {
    initAuth();
  }, []);

  // 注意：token 过期检查由服务端中间件处理
  // sessionStorage 会在浏览器会话结束时自动清除，提供会话级别的安全性

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
