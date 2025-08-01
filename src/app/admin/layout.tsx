import { AuthProvider } from '@/contexts/auth-context';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * 管理员区域布局
 * 提供认证上下文，所有管理员页面都会被 AuthProvider 包裹
 */
export default function AdminRootLayout({ children }: AdminLayoutProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
