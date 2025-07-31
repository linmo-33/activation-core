import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 简单的 JWT 解码函数（仅用于中间件，不验证签名）
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1]));

    // 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// 需要保护的路径
const protectedPaths = [
  '/admin',
  '/admin/codes',
  '/admin/generate',
  '/admin/settings'
];

// 需要保护的 API 路径
const protectedApiPaths = [
  '/api/admin/codes',
  '/api/admin/stats'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('中间件处理路径:', pathname);

  // 检查是否是需要保护的路径
  const isProtectedPath = protectedPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  const isProtectedApiPath = protectedApiPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  console.log('路径保护状态:', { pathname, isProtectedPath, isProtectedApiPath });

  // 如果不是保护的路径，直接通过
  if (!isProtectedPath && !isProtectedApiPath) {
    console.log('路径不需要保护，直接通过');
    return NextResponse.next();
  }

  // 从 Cookie 中获取 token
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    // 如果是 API 路径，返回 401
    if (isProtectedApiPath) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }
    
    // 如果是页面路径，重定向到登录页
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 解码 JWT token（不验证签名，仅在中间件中使用）
    const decoded = decodeJWT(token);

    // 检查 token 是否包含必要信息
    if (!decoded.id || !decoded.username || decoded.role !== 'admin') {
      throw new Error('Invalid token payload');
    }

    // 将用户信息添加到请求头中，供 API 使用
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-id', decoded.id.toString());
    requestHeaders.set('x-admin-username', decoded.username);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('JWT 验证失败:', error);
    console.error('Token:', token);
    console.error('JWT_SECRET exists:', !!JWT_SECRET);
    
    // 清除无效的 token
    const response = isProtectedApiPath 
      ? NextResponse.json(
          { success: false, message: 'Token 无效或已过期' },
          { status: 401 }
        )
      : NextResponse.redirect(new URL('/admin/login', request.url));

    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    // 匹配管理员根路径
    '/admin',
    // 匹配需要保护的管理员路径（排除登录页面）
    '/admin/((?!login).*)',
    // 匹配管理员 API 路径（排除登录 API）
    '/api/admin/((?!login).*)',
  ],
};
