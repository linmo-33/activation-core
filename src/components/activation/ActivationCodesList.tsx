'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TextDialog from '@/components/TextDialog'
import { ActivationCode, ActivationStats, ConfirmDialogProps, ExportDialogProps } from './types'

interface ActivationCodesListProps {
  confirmDialog: ConfirmDialogProps
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogProps>>
}

export default function ActivationCodesList({ confirmDialog, setConfirmDialog }: ActivationCodesListProps) {
  const [stats, setStats] = useState<ActivationStats>({ total: 0, used: 0, unused: 0, expired: 0 })
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [generateForm, setGenerateForm] = useState({
    amount: 1,
    expiryDays: 30
  })
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [exportDialog, setExportDialog] = useState<ExportDialogProps>({ open: false, text: '' })

  const router = useRouter()

  const loadData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/codes/list?page=${currentPage}&search=${searchTerm}&status=${statusFilter}`)
      const data = await response.json()
      
      if (data.success) {
        setCodes(data.codes)
        setStats(data.stats)
      } else {
        if (response.status === 401) {
          router.push('/admin/login')
          return
        }
        setError(data.message || '加载数据失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter, router])

  useEffect(() => {
    setIsLoading(true)
    loadData()
  }, [loadData])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/admin/codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateForm),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(`成功生成 ${data.amount} 个激活码`)
        setGenerateForm({ amount: 1, expiryDays: 30 })
        loadData()
      } else {
        setError(data.message || '生成失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      open: true,
      title: '删除激活码',
      content: '确定要删除这个激活码吗？',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, open: false }))
        try {
          const response = await fetch('/api/admin/codes/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
          const data = await response.json()
          if (data.success) {
            setSuccessMessage('激活码删除成功')
            loadData()
          } else {
            setError(data.message || '删除失败')
          }
        } catch (err) {
          setError('网络错误，请稍后重试')
        }
      }
    })
  }

  const handleReset = async (id: number) => {
    setConfirmDialog({
      open: true,
      title: '重置激活码',
      content: '确定要重置这个激活码的状态吗？重置后激活码可以再次使用。',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, open: false }))
        try {
          const response = await fetch('/api/admin/codes/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
          const data = await response.json()
          if (data.success) {
            setSuccessMessage('激活码状态重置成功')
            loadData()
          } else {
            setError(data.message || '重置失败')
          }
        } catch (err) {
          setError('网络错误，请稍后重试')
        }
      }
    })
  }

  const handleDisable = async (id: number) => {
    const targetCode = codes.find(code => code.id === id)
    const confirmMessage = targetCode?.isUsed
      ? '确定要使这个已使用的激活码失效吗？此操作可能影响已激活的用户，请谨慎操作。'
      : '确定要使这个激活码失效吗？失效后激活码将无法使用。'
    setConfirmDialog({
      open: true,
      title: '禁用激活码',
      content: confirmMessage,
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, open: false }))
        try {
          const response = await fetch('/api/admin/codes/disable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
          const data = await response.json()
          if (data.success) {
            setSuccessMessage('激活码已失效')
            loadData()
          } else {
            setError(data.message || '失效操作失败')
          }
        } catch (err) {
          setError('网络错误，请稍后重试')
        }
      }
    })
  }

  // 多选操作
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(codes.map(c => c.id))
    } else {
      setSelectedIds([])
    }
  }
  
  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
  }

  // 批量导出
  const handleExport = async () => {
    const ids = selectedIds.length > 0 ? selectedIds : undefined
    const res = await fetch('/api/admin/codes/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    const data = await res.json()
    if (data.success) {
      setExportDialog({ open: true, text: data.codeList })
    } else {
      setExportDialog({ open: true, text: '导出失败：' + (data.message || '未知错误') })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 错误和成功消息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">#</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">总激活码</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">已使用</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.used}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">○</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">未使用</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.unused}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">×</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">已过期</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.expired}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 生成激活码表单 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">生成激活码</h3>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">生成数量</label>
              <input
                type="number"
                min="1"
                max="100"
                value={generateForm.amount}
                onChange={(e) => setGenerateForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isGenerating}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">有效期（天）</label>
              <input
                type="number"
                min="1"
                max="365"
                value={generateForm.expiryDays}
                onChange={(e) => setGenerateForm(prev => ({ ...prev, expiryDays: parseInt(e.target.value) || 30 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isGenerating}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isGenerating}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-medium"
              >
                {isGenerating ? '生成中...' : '生成'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 激活码列表 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          {/* 标题 */}
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">激活码列表</h3>
          
          {/* 搜索/筛选区 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索激活码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* 状态筛选 */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[100px]"
              >
                <option value="all">全部状态</option>
                <option value="unused">未使用</option>
                <option value="used">已使用</option>
                <option value="expired">已过期</option>
              </select>
            </div>
            {/* 重置按钮 */}
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setCurrentPage(1)
              }}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors whitespace-nowrap"
            >
              重置
            </button>
          </div>
          {/* 批量操作按钮区 */}
          <div className="flex gap-4 mb-4 mt-4">
            <button
              onClick={handleExport}
              disabled={codes.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-medium"
            >
              批量导出{selectedIds.length > 0 ? `（${selectedIds.length}）` : ''}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <div className="flex items-center justify-center">
                      <input type="checkbox" checked={selectedIds.length === codes.length && codes.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">激活码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">禁用</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">激活设备ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">过期时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 w-10">
                      <div className="flex items-center justify-center">
                        <input type="checkbox" checked={selectedIds.includes(code.id)} onChange={e => handleSelectOne(code.id, e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{code.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.isUsed ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">已使用</span>
                      ) : code.expiresAt && new Date(code.expiresAt) < new Date() ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">已过期</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">未使用</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.isDisabled ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-300 text-gray-700">已禁用</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700">正常</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {code.isUsed ? (
                        <div className="space-y-1">
                          <div className="truncate max-w-32" title={code.usedBy || ''}>
                            {code.usedBy || '-'}
                          </div>
                          {code.usedIp && (
                            <div className="text-gray-500 text-xs">
                              <span className="font-medium">IP:</span> {code.usedIp}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.usedAt ? formatDate(code.usedAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(code.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(code.expiresAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-3">
                        {code.isUsed && (
                          <button
                            onClick={() => window.switchToLogsTab?.(code.id)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium hover:underline transition-colors"
                          >
                            查看日志
                          </button>
                        )}
                        {code.isUsed && (
                          <button
                            onClick={() => handleReset(code.id)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium hover:underline transition-colors"
                          >
                            重置
                          </button>
                        )}
                        {(!code.expiresAt || new Date(code.expiresAt) > new Date()) && (
                          <button
                            onClick={() => handleDisable(code.id)}
                            className="text-gray-600 hover:text-gray-900 text-sm font-medium hover:underline transition-colors"
                          >
                            禁用
                          </button>
                        )}
                        {code.isDisabled && (
                          <button
                            onClick={() => setConfirmDialog({
                              open: true,
                              title: '启用激活码',
                              content: '确定要启用这个激活码吗？',
                              onConfirm: async () => {
                                setConfirmDialog(d => ({ ...d, open: false }))
                                const response = await fetch('/api/admin/codes/enable', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: code.id }),
                                })
                                const data = await response.json()
                                if (data.success) {
                                  setSuccessMessage('激活码已启用')
                                  loadData()
                                } else {
                                  setError(data.message || '启用操作失败')
                                }
                              }
                            })}
                            className="text-green-600 hover:text-green-900 text-sm font-medium hover:underline transition-colors"
                          >
                            启用
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium hover:underline transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {codes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无激活码数据</p>
            </div>
          )}
        </div>
      </div>
      <TextDialog
        open={exportDialog.open}
        title="激活码导出"
        text={exportDialog.text}
        onClose={() => setExportDialog({ open: false, text: '' })}
      />
    </div>
  )
} 