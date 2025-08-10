export const PRODUCTION_FALLBACK = "https://nailfeed-backend-production.up.railway.app"

const isLocalUrl = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(url)

export const getApiBaseUrl = (opts?: { preferLocal?: boolean }): string => {
  const serverUrl = (process.env.API_URL || "").trim()
  const publicUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim()
  const preferLocal = Boolean(opts?.preferLocal)
  const localDefault = "http://127.0.0.1:1337"

  // If we prefer local, try to force a local URL even if envs are set to prod
  if (preferLocal) {
    if (serverUrl && isLocalUrl(serverUrl)) return serverUrl
    if (publicUrl && isLocalUrl(publicUrl)) return publicUrl
    return localDefault
  }

  // Otherwise use explicit envs if provided
  if (serverUrl) return serverUrl
  if (publicUrl) return publicUrl

  // Fallbacks
  if (process.env.NODE_ENV === "development") return localDefault
  return PRODUCTION_FALLBACK
}
