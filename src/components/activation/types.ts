// 激活码类型定义
export interface ActivationCode {
  id: number
  code: string
  isUsed: boolean
  usedAt: string | null
  usedBy: string | null
  usedIp: string | null
  activationCount: number
  createdAt: string
  expiresAt: string | null
  isDisabled: boolean
}

// 激活码统计类型
export interface ActivationStats {
  total: number
  used: number
  unused: number
  expired: number
}

// 日志数据类型
export interface LogData {
  id: number
  activationCode: string
  machineId: string
  ipAddress: string | null
  userAgent: string | null
  isSuccess: boolean
  errorMessage: string | null
  createdAt: string
}

// 日志响应类型
export interface LogsResponse {
  logs: LogData[]
  stats: {
    total: number
    success: number
    failed: number
    uniqueMachines: number
    uniqueIPs: number
  }
  pagination: {
    total: number
    pages: number
  }
}

// 确认对话框类型
export interface ConfirmDialogProps {
  open: boolean
  title: string
  content: string
  onConfirm: () => void
}

// 导出对话框类型
export interface ExportDialogProps {
  open: boolean
  text: string
}

// 删除对话框类型
export interface DeleteDialogProps {
  open: boolean
  ids: number[]
}

// 扩展Window接口
declare global {
  interface Window {
    switchToLogsTab?: (codeId: number) => void
  }
} 