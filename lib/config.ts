/**
 * Application Configuration
 *
 * This file centralizes all environment variables and configuration settings
 * for the application. It provides type-safe access to configuration values
 * and default fallbacks when environment variables are not set.
 */

// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
export const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || process.env.API_TOKEN || ""

// Request configuration
export const REQUEST_CONFIG = {
  minRequestInterval: 800, // Minimum time between requests in ms
  maxRetries: 3,
  initialBackoff: 500, // Initial backoff time in ms
}

// Feature flags
export const FEATURES = {
  enableDetailedLogging: true,
  useFallbackData: false, // Disable fallback data
}

// Configuration settings for the application
const config = {
  api: {
    // API URL with production fallback
    API_URL: process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app",

    // API token from environment variables
    API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN || process.env.API_TOKEN || "",

    // Public API token for client-side requests
    PUBLIC_API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN || "",

    // Get the full API URL for a path
    getFullApiUrl: (path: string): string => {
      const baseUrl = config.api.API_URL
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
      const normalizedPath = path.startsWith("/") ? path.substring(1) : path
      return `${normalizedBase}/${normalizedPath}`
    },

    // Get the API token
    getApiToken: (usePublic = false): string | null => {
      if (usePublic) {
        return config.api.PUBLIC_API_TOKEN || null
      }
      return config.api.API_TOKEN || null
    },

    // Use sample data - always false
    useSampleData: () => false,
  },

  app: {
    // Application URL
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : ""),

    // Get the full URL for a path
    getFullUrl: (path: string): string => {
      const baseUrl = config.app.APP_URL
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
      const normalizedPath = path.startsWith("/") ? path.substring(1) : path
      return `${normalizedBase}/${normalizedPath}`
    },

    // Get the URL for a post
    getPostShareUrl: (postId: number | string): string => {
      return config.app.getFullUrl(`post/${postId}`)
    },

    // Get the URL for a profile
    getProfileUrl: (username: string): string => {
      return config.app.getFullUrl(`profile/${username}`)
    },

    // Get the URL for a collection
    getCollectionUrl: (collectionId: number | string): string => {
      return config.app.getFullUrl(`collections/${collectionId}`)
    },
  },

  features: {
    // Feature flags from environment variables
    USE_SAMPLE_DATA: false, // Always false
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
    ENABLE_COMMENTS: process.env.NEXT_PUBLIC_ENABLE_COMMENTS === "true",
    ENABLE_REACTIONS: process.env.NEXT_PUBLIC_ENABLE_REACTIONS === "true",
    ENABLE_SOCIAL_AUTH: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_AUTH === "true",
  },

  // Flag to track if configuration has been initialized
  isInitialized: false,

  // Initialize and validate configuration
  initialize: () => {
    if (config.isInitialized) {
      return
    }

    // Log configuration in development
    if (process.env.NODE_ENV === "development") {
      console.log("🔧 App Configuration:", {
        API_URL: config.api.API_URL,
        APP_URL: config.app.APP_URL,
        HAS_API_TOKEN: !!config.api.API_TOKEN,
        HAS_PUBLIC_API_TOKEN: !!config.api.PUBLIC_API_TOKEN,
        FEATURES: config.features,
      })
    }

    // Mark as initialized
    config.isInitialized = true
  },
}

// Initialize configuration
config.initialize()

/**
 * Check if sample data should be used
 * @returns Always false as we don't use sample data
 */
export function useSampleData(): boolean {
  return false
}

export default config
