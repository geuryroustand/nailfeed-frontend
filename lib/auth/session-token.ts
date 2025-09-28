import { createHash } from "crypto"
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
let fallbackWarningIssued = false

function hashFallbackSecret(source: string): string {
  return createHash("sha256").update(source).digest("hex")
}

function getRawSecret(): string {
  const explicitSecret = process.env.JWT_SECRET
  if (explicitSecret && explicitSecret.trim().length > 0) {
    return explicitSecret
  }

  const fallbackSource =
    process.env.API_TOKEN ||
    process.env.NEXT_PUBLIC_API_TOKEN ||
    process.env.WEBHOOK_SECRET ||
    null

  if (fallbackSource) {
    if (!fallbackWarningIssued) {
      console.warn(
        "[session-token] JWT_SECRET is not defined. Using a hashed fallback derived from API credentials. " +
          "Set JWT_SECRET in production for stronger security."
      )
      fallbackWarningIssued = true
    }
    return hashFallbackSecret(fallbackSource)
  }

  throw new Error("JWT_SECRET environment variable is not defined")
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
