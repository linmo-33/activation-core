"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth-client";

interface UserInfo {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshAuth: () => Promise<void>;
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
  const initAuth = async () => {
    try {
      const sessionState = await fetchCurrentUser();

      if (sessionState.status === "authenticated") {
        setUser(sessionState.user);
      } else if (sessionState.status === "unauthenticated") {
        setUser(null);
      }
    } catch (error) {
      console.error("初始化认证状态失败:", error);
    } finally {
      setIsLoading(false);
    }
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
      setUser(null);
      router.push("/admin/login");
      router.refresh();
    }
  };

  // 刷新认证状态
  const refreshAuth = async () => {
    const sessionState = await fetchCurrentUser();

    if (sessionState.status === "authenticated") {
      setUser(sessionState.user);
      return;
    }

    if (sessionState.status === "unauthenticated") {
      setUser(null);
      router.push("/admin/login");
      router.refresh();
    }
  };

  // 组件挂载时初始化
  useEffect(() => {
    void initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
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
