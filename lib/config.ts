/**
 * Application Configuration
 *
 * Centralizes env variables and settings with safe server/client access.
 * Note: Do not expose secrets to the client. Only NEXT_PUBLIC_ values are bundled on the client [^5].
 */

// Shared config used by both client and server. Avoid importing server-only modules here.

// Public base URL for the API (safe to expose). Falls back to production backend if not set.
export const API_URL: string =
  (process.env.NEXT_PUBLIC_API_URL?.trim() as string) || "https://nailfeed-backend-production.up.railway.app"

// Basic request throttling configuration used by client services.
export type RequestConfig = {
  minRequestInterval: number
}

export const REQUEST_CONFIG: RequestConfig = {
  // 250ms between requests by default to reduce bursty client traffic
  minRequestInterval: 250,
}

export const POLLING_CONFIG = {
  ENABLE_POLLING: true,
  REACTION_POLLING_INTERVAL: 5000, // 5 seconds
  COMMENT_POLLING_INTERVAL: 10000, // 10 seconds
  POST_POLLING_INTERVAL: 30000, // 30 seconds
}

// Server-only token (not exposed to client)
const API_TOKEN = process.env.API_TOKEN || ""

// Feature flags
export const FEATURES = {
  enableDetailedLogging: true,
  useFallbackData: false,
}

export const getServerApiToken = (): string | null => {
  if (typeof window !== "undefined") return null
  return API_TOKEN || null
}

const config = {
  api: {
    API_URL,
    // Get full API URL for a path
    getFullApiUrl: (path: string): string => {
      const normalizedBase = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL
      const normalizedPath = path.startsWith("/") ? path.substring(1) : path
      return `${normalizedBase}/${normalizedPath}`
    },

    // Server-only token getter
    getApiToken: (): string | null => {
      return getServerApiToken()
    },

    // Never use sample data here
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
        HAS_SERVER_API_TOKEN: !!API_TOKEN,
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
