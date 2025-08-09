const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"])

export type GoogleIdTokenClaims = {
  iss: string
  aud: string
  sub: string
  email?: string
  email_verified?: boolean | "true" | "false"
  name?: string
  picture?: string
  exp: number // seconds since epoch
}

/**
 * Verifies a Google id_token via Google's tokeninfo endpoint.
 * Optionally enforces audience to match expectedAud.
 */
export async function verifyGoogleIdToken(idToken: string, expectedAud?: string): Promise<GoogleIdTokenClaims> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    cache: "no-store",
  })
  if (!res.ok) throw new Error("Invalid Google ID token")

  const data = (await res.json()) as Record<string, unknown>

  const iss = String(data.iss)
  if (!GOOGLE_ISSUERS.has(iss)) throw new Error("Invalid issuer")

  const exp = Number(data.exp)
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) throw new Error("Token expired")

  const aud = String(data.aud ?? "")
  if (expectedAud && aud !== expectedAud) throw new Error("Audience mismatch")

  return {
    iss,
    aud,
    sub: String(data.sub),
    email: (data.email as string) || undefined,
    email_verified: (data.email_verified as boolean | "true" | "false") ?? undefined,
    name: (data.name as string) || undefined,
    picture: (data.picture as string) || undefined,
    exp,
  }
}

/**
 * Ensures redirect target is relative and safe.
 */
export function safeRelativeRedirect(next?: string): string {
  if (!next) return "/"
  try {
    const url = new URL(next, "http://localhost")
    // Disallow absolute external URLs
    if (url.origin !== "http://localhost") return "/"
    return url.pathname + url.search + url.hash
  } catch {
    return "/"
  }
}
