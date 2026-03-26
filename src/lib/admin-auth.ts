import { SignJWT } from 'jose';

const ADMIN_SESSION_MAX_AGE = 24 * 60 * 60;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
  throw new Error('🔒 安全错误: JWT_SECRET 环境变量未设置或使用默认值，请设置强随机密钥');
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface AdminSessionUser {
  id: number;
  username: string;
}

export async function createAdminSessionToken(user: AdminSessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    role: 'admin'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export function getAdminSessionCookieOptions(maxAge: number = ADMIN_SESSION_MAX_AGE) {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge,
    path: '/'
  } as const;
}

export function getClearedAdminSessionCookieOptions() {
  return getAdminSessionCookieOptions(0);
}
