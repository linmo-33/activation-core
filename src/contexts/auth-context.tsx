"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, clearAuth, getTokenRemainingTime } from '@/lib/auth-client';

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
      const currentUser = getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('初始化认证状态失败:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = (userData: UserInfo) => {
    setUser(userData);
  };

  // 登出
  const logout = async () => {
    try {
      // 调用登出 API
      await fetch('/api/admin/login', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('登出 API 调用失败:', error);
    } finally {
      // 无论 API 是否成功，都清除本地认证信息
      clearAuth();
      setUser(null);
      router.push('/admin/login');
      router.refresh();
    }
  };

  // 刷新认证状态
  const refreshAuth = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (!currentUser) {
      router.push('/admin/login');
    }
  };

  // 组件挂载时初始化
  useEffect(() => {
    initAuth();
  }, []);

  // 定期检查 token 状态
  useEffect(() => {
    if (!user) return;

    const checkTokenStatus = () => {
      const remainingTime = getTokenRemainingTime();
      
      if (remainingTime <= 0) {
        // Token 已过期
        console.warn('Token 已过期，自动登出');
        logout();
      } else if (remainingTime < 300) { // 5分钟内过期
        // Token 即将过期，可以在这里实现自动刷新
        console.warn('Token 即将过期，剩余时间:', remainingTime, '秒');
      }
    };

    // 立即检查一次
    checkTokenStatus();

    // 每分钟检查一次
    const interval = setInterval(checkTokenStatus, 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
