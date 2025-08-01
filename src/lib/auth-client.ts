/**
 * 客户端认证工具
 * 处理 JWT token 的解码和用户信息获取
 */

interface JWTPayload {
  id: number;
  username: string;
  role: string;
  exp: number;
  iat: number;
}

interface UserInfo {
  id: number;
  username: string;
  role: string;
}

/**
 * 从 cookie 中获取 token
 */
export function getAdminToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie =>
    cookie.trim().startsWith('token=')
  );

  if (!tokenCookie) return null;

  const token = tokenCookie.split('=')[1];
  return token || null;
}

/**
 * 解码 JWT token（客户端安全解码，不验证签名）
 * @param token JWT token
 * @returns 解码后的 payload 或 null
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // 检查必要字段
    if (!payload.id || !payload.username || !payload.exp) {
      return null;
    }

    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT 解码失败:', error);
    return null;
  }
}

/**
 * 检查 token 是否过期
 * @param payload JWT payload
 * @returns 是否过期
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * 检查 token 是否即将过期（5分钟内）
 * @param payload JWT payload
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;
  return payload.exp - now < fiveMinutes;
}

/**
 * 获取当前用户信息
 * @returns 用户信息或 null
 */
export function getCurrentUser(): UserInfo | null {
  const token = getAdminToken();
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload) return null;

  if (isTokenExpired(payload)) {
    console.warn('Token 已过期');
    return null;
  }

  return {
    id: payload.id,
    username: payload.username,
    role: payload.role
  };
}

/**
 * 清除认证信息
 */
export function clearAuth(): void {
  if (typeof document === 'undefined') return;

  // 清除新的 token cookie
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

  // 清除旧的 admin_token cookie（向后兼容）
  document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

/**
 * 检查用户是否已登录
 * @returns 是否已登录
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * 获取 token 剩余时间（秒）
 * @returns 剩余时间或 0
 */
export function getTokenRemainingTime(): number {
  const token = getAdminToken();
  if (!token) return 0;

  const payload = decodeJWT(token);
  if (!payload) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}
