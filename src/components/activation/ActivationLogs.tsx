'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { LogsResponse, DeleteDialogProps } from './types'

interface ActivationLogsProps {
  codeIdFilter?: number | null
}

export default function ActivationLogs({ codeIdFilter = null }: ActivationLogsProps) {
  const [data, setData] = useState<LogsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [successFilter, setSuccessFilter] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [selectedLogIds, setSelectedLogIds] = useState<number[]>([])
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogProps>({ open: false, ids: [] })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (successFilter) params.append('success', successFilter)
      if (codeIdFilter) params.append('codeId', codeIdFilter.toString())

      const response = await fetch(`/api/admin/logs?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        setError(result.message || '加载日志失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, successFilter, pageSize, codeIdFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const formatIP = (ip: string | null) => {
    if (!ip) return '-'
    return ip.length > 15 ? ip.substring(0, 15) + '...' : ip
  }

  // 多选操作
  const handleSelectAllLogs = (checked: boolean) => {
    if (checked && data?.logs) {
      setSelectedLogIds(data.logs.map(l => l.id))
    } else {
      setSelectedLogIds([])
    }
  }
  
  const handleSelectOneLog = (id: number, checked: boolean) => {
    setSelectedLogIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
  }

  // 批量删除
  const handleBatchDelete = () => {
    setDeleteDialog({ open: true, ids: selectedLogIds })
  }
  
  const handleDeleteConfirm = async () => {
    setDeleteDialog({ open: false, ids: [] })
    await fetch('/api/admin/logs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: deleteDialog.ids }),
    })
    setSelectedLogIds([])
    loadData()
  }
  
  const handleDeleteOne = (id: number) => {
    setDeleteDialog({ open: true, ids: [id] })
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                    <dt className="text-sm font-medium text-gray-500 truncate">总记录数</dt>
                    <dd className="text-2xl font-bold text-gray-900">{data.stats.total}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">成功激活</dt>
                    <dd className="text-2xl font-bold text-gray-900">{data.stats.success}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">失败尝试</dt>
                    <dd className="text-2xl font-bold text-gray-900">{data.stats.failed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📱</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">活跃设备</dt>
                    <dd className="text-2xl font-bold text-gray-900">{data.stats.uniqueMachines}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🌐</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">唯一IP</dt>
                    <dd className="text-2xl font-bold text-gray-900">{data.stats.uniqueIPs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          {/* 搜索/筛选区 */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索激活码、IP地址、设备ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* 状态筛选 */}
            <div>
              <select
                value={successFilter}
                onChange={(e) => setSuccessFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[100px]"
              >
                <option value="">全部状态</option>
                <option value="true">成功</option>
                <option value="false">失败</option>
              </select>
            </div>
            {/* 重置按钮 */}
            <button
              onClick={() => {
                setSearchTerm('')
                setSuccessFilter('')
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
              onClick={handleBatchDelete}
              disabled={selectedLogIds.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-medium"
            >
              批量删除{selectedLogIds.length > 0 ? `（${selectedLogIds.length}）` : ''}
            </button>
          </div>

          {/* 活跃筛选标签 */}
          {(searchTerm || successFilter || codeIdFilter) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                  搜索: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              )}
              {successFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                  状态: {successFilter === 'true' ? '成功' : '失败'}
                  <button onClick={() => setSuccessFilter('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                </span>
              )}
              {codeIdFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-800">
                  激活码ID: {codeIdFilter}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">激活日志</h3>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <span className="text-sm text-gray-500">共 {data?.stats.total || 0} 条</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <div className="flex items-center justify-center">
                      <input type="checkbox" checked={data?.logs && selectedLogIds.length === data.logs.length && data.logs.length > 0} onChange={e => handleSelectAllLogs(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">激活码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">机器ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">错误信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 w-10">
                      <div className="flex items-center justify-center">
                        <input type="checkbox" checked={selectedLogIds.includes(log.id)} onChange={e => handleSelectOneLog(log.id, e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {log.activationCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="truncate block max-w-32" title={log.machineId}>
                        {log.machineId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span title={log.ipAddress || ''}>
                        {formatIP(log.ipAddress)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userAgent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.isSuccess 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.isSuccess ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="truncate block max-w-32" title={log.errorMessage || ''}>
                        {log.errorMessage || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteOne(log.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium hover:underline transition-colors"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!data?.logs || data.logs.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无日志数据</p>
            </div>
          )}
        </div>
      </div>

      {/* 分页 */}
      {data && data.pagination.total > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                显示第 {((currentPage - 1) * pageSize) + 1} 到 {Math.min(currentPage * pageSize, data.pagination.total)} 条，
                共 {data.pagination.total} 条记录
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm">
                  第 {currentPage} 页，共 {data.pagination.pages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(data.pagination.pages, currentPage + 1))}
                  disabled={currentPage === data.pagination.pages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={deleteDialog.open}
        title="删除日志"
        content={`确定要删除选中的${deleteDialog.ids.length}条日志吗？此操作不可恢复。`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, ids: [] })}
      />
    </div>
  )
} 