import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { isIpAllowed } from '@/lib/utils'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 获取客户端IP
  const clientIp = getClientIp(request)
  
  // 管理后台路径需要IP白名单检查
  if (pathname.startsWith('/admin')) {
    const adminWhitelist = process.env.ADMIN_IP_WHITELIST?.split(',') || []
    
    if (!isIpAllowed(clientIp, adminWhitelist)) {
      return NextResponse.json(
        { success: false, message: '访问被拒绝：IP地址不在白名单中' },
        { status: 403 }
      )
    }
    
    // 登录页面不需要JWT验证
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }
    
    // 其他管理页面需要JWT验证
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    const payload = await verifyJWT(token)
    if (!payload) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }
  
  // API路由的特殊处理
  if (pathname.startsWith('/api/admin') && !pathname.includes('/login')) {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }
    
    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '令牌无效' },
        { status: 401 }
      )
    }
  }
  
  return NextResponse.next()
}

/**
 * 获取客户端真实IP地址
 */
function getClientIp(request: NextRequest): string {
  // 尝试从各种可能的头部获取真实IP
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (xForwardedFor) {
    // x-forwarded-for 可能包含多个IP，取第一个
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIp) {
    return xRealIp
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  // 回退到连接IP
  return request.ip || '127.0.0.1'
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
} 