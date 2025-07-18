import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '激活码管理系统 - 管理后台',
  description: '激活码管理系统管理后台，用于管理激活码的生成、验证和维护',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 