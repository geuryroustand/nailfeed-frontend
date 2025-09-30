let cachedAuthState: { value: boolean; expiresAt: number } | null = null
let inflightRequest: Promise<boolean> | null = null

interface ClientSessionOptions {
  force?: boolean
  cacheTtlMs?: number
}

const DEFAULT_CACHE_TTL = 5_000

export async function getClientSessionStatus(options: ClientSessionOptions = {}): Promise<boolean> {
  if (typeof window === "undefined") {
    return false
  }

  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL
  const now = Date.now()

  if (!options.force && cachedAuthState && cachedAuthState.expiresAt > now) {
    return cachedAuthState.value
  }

  if (!options.force && inflightRequest) {
    return inflightRequest
  }

  inflightRequest = (async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        cachedAuthState = { value: false, expiresAt: Date.now() + cacheTtlMs }
        return false
      }

      const data = await response.json().catch(() => null)
      const authenticated = Boolean(data?.authenticated && data?.user)
      cachedAuthState = { value: authenticated, expiresAt: Date.now() + cacheTtlMs }
      return authenticated
    } catch (error) {
      console.error("[client-session] Failed to resolve session status:", error)
      cachedAuthState = { value: false, expiresAt: Date.now() + cacheTtlMs }
      return false
    } finally {
      inflightRequest = null
    }
  })()

  return inflightRequest
}

export function clearClientSessionStatusCache(): void {
  cachedAuthState = null
}
