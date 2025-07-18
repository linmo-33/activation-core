'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'
import ActivationCodesList from '@/components/activation/ActivationCodesList'
import ActivationLogs from '@/components/activation/ActivationLogs'
import { ConfirmDialogProps } from '@/components/activation/types'

// Tab组件
interface TabButtonProps {
  id: string
  label: string
  isActive: boolean
  onClick: (id: string) => void
}

function TabButton({ id, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`relative px-6 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [activeTab, setActiveTab] = useState('codes')
  const [codeIdFilter, setCodeIdFilter] = useState<number | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps>({ 
    open: false, 
    title: '', 
    content: '', 
    onConfirm: () => {} 
  })

  useEffect(() => {
    const tab = searchParams.get('tab')
    const codeId = searchParams.get('codeId')
    
    if (tab === 'logs') {
      setActiveTab('logs')
    }
    if (codeId) {
      setCodeIdFilter(parseInt(codeId))
    }
  }, [searchParams])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabId)
    if (tabId !== 'logs') {
      url.searchParams.delete('codeId')
      setCodeIdFilter(null)
    }
    window.history.pushState({}, '', url)
  }

  // 全局函数供子组件调用
  useEffect(() => {
    window.switchToLogsTab = (codeId: number) => {
      setCodeIdFilter(codeId)
      setActiveTab('logs')
      const url = new URL(window.location.href)
      url.searchParams.set('tab', 'logs')
      url.searchParams.set('codeId', codeId.toString())
      window.history.pushState({}, '', url)
    }
    
    return () => {
      delete window.switchToLogsTab
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (err) {
      console.error('登出失败:', err)
      router.push('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">激活码管理系统</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Tab导航 */}
        <div className="mb-8">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <TabButton
              id="codes"
              label="🔑 激活码管理"
              isActive={activeTab === 'codes'}
              onClick={handleTabChange}
            />
            <TabButton
              id="logs"
              label="📊 激活日志"
              isActive={activeTab === 'logs'}
              onClick={handleTabChange}
            />
          </div>
        </div>

        {/* Tab内容 */}
        {activeTab === 'codes' && <ActivationCodesList confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />}
        {activeTab === 'logs' && <ActivationLogs codeIdFilter={codeIdFilter} />}
      </div>
      {/* 挂载弹窗 */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        content={confirmDialog.content}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
      />
    </div>
  )
}