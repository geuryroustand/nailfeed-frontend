/**
 * Application Configuration (client-safe)
 *
 * - Do NOT reference NEXT_PUBLIC_API_TOKEN here.
 * - Only server code should access process.env.API_TOKEN directly.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

// Server-only token getter (returns null on client)
export const getServerApiToken = (): string | null => {
  if (typeof window !== "undefined") return null
  return process.env.API_TOKEN || null
}

export const REQUEST_CONFIG = {
  minRequestInterval: 800,
  maxRetries: 3,
  initialBackoff: 500,
}

export const FEATURES = {
  enableDetailedLogging: true,
  useFallbackData: false,
}

const config = {
  api: {
    API_URL,
    getFullApiUrl: (path: string): string => {
      const normalizedBase = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL
      const normalizedPath = path.startsWith("/") ? path.substring(1) : path
      return `${normalizedBase}/${normalizedPath}`
    },
    // Server-only token accessor. Client will receive null.
    getApiToken: (): string | null => getServerApiToken(),
    useSampleData: () => false,
  },
  app: {
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : ""),
    getFullUrl: (path: string): string => {
      const baseUrl = config.app.APP_URL
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
      const normalizedPath = path.startsWith("/") ? path.substring(1) : path
      return `${normalizedBase}/${normalizedPath}`
    },
    getPostShareUrl: (postId: number | string): string => config.app.getFullUrl(`post/${postId}`),
    getProfileUrl: (username: string): string => config.app.getFullUrl(`profile/${username}`),
    getCollectionUrl: (collectionId: number | string): string => config.app.getFullUrl(`collections/${collectionId}`),
  },
  features: {
    USE_SAMPLE_DATA: false,
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
    ENABLE_COMMENTS: process.env.NEXT_PUBLIC_ENABLE_COMMENTS === "true",
    ENABLE_REACTIONS: process.env.NEXT_PUBLIC_ENABLE_REACTIONS === "true",
    ENABLE_SOCIAL_AUTH: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_AUTH === "true",
  },
  isInitialized: false,
  initialize: () => {
    if (config.isInitialized) return
    if (process.env.NODE_ENV === "development") {
      console.log("🔧 App Configuration:", {
        API_URL: config.api.API_URL,
        APP_URL: config.app.APP_URL,
        HAS_SERVER_API_TOKEN: !!getServerApiToken(),
        FEATURES: config.features,
      })
    }
    config.isInitialized = true
  },
}

config.initialize()

export function useSampleData(): boolean {
  return false
}

export default config
