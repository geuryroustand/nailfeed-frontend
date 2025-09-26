import { jwtVerify, JWTPayload } from "jose"

export const SESSION_COOKIE_NAME = "session"

export interface SessionTokenPayload extends JWTPayload {
  userId: string | number
  email: string
  username: string
  strapiJWT: string
  expiresAt: string
}

const encoder = new TextEncoder()

let cachedSecret: Uint8Array | null = null
let cachedSecretSource: string | null = null

function getRawSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined")
  }

  return secret
}

export function getSessionSecret(): Uint8Array {
  const rawSecret = getRawSecret()

  if (!cachedSecret || cachedSecretSource !== rawSecret) {
    cachedSecret = encoder.encode(rawSecret)
    cachedSecretSource = rawSecret
  }

  return cachedSecret
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret())

    const expiresAt =
      typeof payload.expiresAt === "string"
        ? payload.expiresAt
        : typeof payload.expiresAt === "number"
          ? new Date(payload.expiresAt * 1000).toISOString()
          : payload.expiresAt instanceof Date
            ? payload.expiresAt.toISOString()
            : undefined

    if (!expiresAt) {
      return null
    }

    return {
      ...(payload as Record<string, unknown>),
      expiresAt,
    } as SessionTokenPayload
  } catch (error) {
    console.error("[session-token] Failed to verify session token:", error)
    return null
  }
}
