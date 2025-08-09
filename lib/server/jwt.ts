import { SignJWT, jwtVerify, type JWTPayload } from "jose"

export type JwtPayload = JWTPayload & {
  sub: string
  email?: string
  name?: string
  picture?: string
  provider?: string
  iss?: string
  aud?: string
}

/**
 * Get signing secret from env with sensible fallbacks for local dev.
 * Use REVALIDATE_SECRET or WEBHOOK_SECRET or API_TOKEN.
 */
function getSecret(): Uint8Array {
  const secret =
    process.env.REVALIDATE_SECRET ||
    process.env.WEBHOOK_SECRET ||
    process.env.API_TOKEN ||
    "dev-only-session-secret-change-me"
  return new TextEncoder().encode(secret)
}

/**
 * Signs a first-party session JWT (HS256).
 */
export async function signJWT(payload: JwtPayload): Promise<string> {
  const secret = getSecret()
  const iat = Math.floor(Date.now() / 1000)
  const exp = payload.exp ?? iat + 60 * 60 * 24 * 7 // default 7 days
  return await new SignJWT({
    ...payload,
    iat,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secret)
}

/**
 * Verifies a first-party session JWT and returns its payload.
 */
export async function verifyJWT(token: string): Promise<JwtPayload> {
  const secret = getSecret()
  const { payload } = await jwtVerify(token, secret)
  return payload as JwtPayload
}
