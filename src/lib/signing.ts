import { importPKCS8, SignJWT, KeyLike } from 'jose'

let cachedPrivateKey: KeyLike | null = null

function ensureEnv(name: string): string {
	const v = process.env[name]
	if (!v) {
		throw new Error(`Security error: missing required env ${name}`)
	}
	return v
}

async function getPrivateKey(): Promise<KeyLike> {
	if (cachedPrivateKey) return cachedPrivateKey
	const pem = ensureEnv('RESPONSE_SIGN_PRIVATE_KEY_PEM').replace(/\\n/g, '\n')
    cachedPrivateKey = await importPKCS8(pem, 'ES256')
	return cachedPrivateKey
}

export function generateNonce(): string {
	try {
		// Prefer Web Crypto when available
		// @ts-ignore
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			// @ts-ignore
			return crypto.randomUUID().replace(/-/g, '')
		}
	} catch {}
	// Fallback to Node crypto
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { randomBytes } = require('crypto') as typeof import('crypto')
	return randomBytes(16).toString('hex')
}

export function getKeyInfo(): { alg: string; kid?: string } {
	const kid = process.env.RESPONSE_SIGN_KEY_ID
	return { alg: 'ES256', ...(kid ? { kid } : {}) }
}

export async function createLicenseToken(
	claims: Record<string, unknown>,
	ttlSeconds?: number
): Promise<string> {
	const key = await getPrivateKey()
	const kid = process.env.RESPONSE_SIGN_KEY_ID
	const nowSec = Math.floor(Date.now() / 1000)
	const ttl = Number.isFinite(ttlSeconds as number)
		? (ttlSeconds as number)
		: parseInt(process.env.RESPONSE_SIGN_TOKEN_TTL_SEC || '120', 10)

	return await new SignJWT(claims)
		.setProtectedHeader({ alg: 'ES256', ...(kid ? { kid } : {}) })
		.setIssuedAt(nowSec)
		.setExpirationTime(nowSec + ttl)
		.sign(key)
} 