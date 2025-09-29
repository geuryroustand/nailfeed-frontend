/**
 * Application Configuration
 *
 * Centralizes env variables and settings with safe server/client access.
 * Note: Do not expose secrets to the client. Only NEXT_PUBLIC_ values are bundled on the client [^5].
 */

// Shared config used by both client and server. Avoid importing server-only modules here.

// Public base URL for the API (safe to expose). Falls back to production backend if not set.
export const API_URL: string =
  (process.env.NEXT_PUBLIC_API_URL?.trim() as string) ||
  "https://nailfeed-backend-production.up.railway.app";

// Basic request throttling configuration used by client services.
export type RequestConfig = {
  minRequestInterval: number;
};

export const REQUEST_CONFIG: RequestConfig = {
  // 250ms between requests by default to reduce bursty client traffic
  minRequestInterval: 250,
};

// Server-only token (not exposed to client)
const API_TOKEN = process.env.API_TOKEN || "";

// Pagination configuration
// These values are optimized for UX and performance balance
export const PAGINATION = {
  INITIAL_POST_LIMIT: 8,    // More initial content for better first impression
  LOAD_MORE_POST_LIMIT: 6,  // Smaller chunks for smooth infinite scroll
};

// Infinite scroll configuration
// Optimized for smooth, predictive loading experience
export const INFINITE_SCROLL = {
  THRESHOLD: 0.3,           // Trigger when 30% of trigger element is visible
  ROOT_MARGIN: '200px',     // Start loading 200px before reaching the trigger
  DEBOUNCE_MS: 100,         // Prevent excessive API calls
};

// Aggressive preloading configuration
// Advanced predictive loading based on user behavior
export const PRELOADING = {
  ENABLED: true,                    // Master switch for preloading
  VELOCITY_THRESHOLD: 100,          // px/s - minimum velocity to trigger preloading
  FAST_SCROLL_THRESHOLD: 300,       // px/s - considered fast scrolling
  PRELOAD_DISTANCE: 3,              // Number of pages to preload ahead
  CACHE_SIZE: 50,                   // Maximum posts to keep in cache
  CACHE_TTL: 5 * 60 * 1000,        // 5 minutes cache TTL
  NETWORK_AWARE: true,              // Adjust behavior based on connection
  SCROLL_PREDICTION_SAMPLES: 10,    // Number of scroll samples for velocity calculation
};

// Feature flags
export const FEATURES = {
  enableDetailedLogging: true,
  useFallbackData: false,
};

export const getServerApiToken = (): string | null => {
  if (typeof window !== "undefined") return null;
  return API_TOKEN || null;
};

const config = {
  api: {
    API_URL,
    // Get full API URL for a path
    getFullApiUrl: (path: string): string => {
      const normalizedBase = API_URL.endsWith("/")
        ? API_URL.slice(0, -1)
        : API_URL;
      const normalizedPath = path.startsWith("/") ? path.substring(1) : path;
      return `${normalizedBase}/${normalizedPath}`;
    },

    // Server-only token getter
    getApiToken: (): string | null => {
      return getServerApiToken();
    },

    // Never use sample data here
    useSampleData: () => false,
  },

  app: {
    APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : ""),
    getFullUrl: (path: string): string => {
      const baseUrl = config.app.APP_URL;
      const normalizedBase = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const normalizedPath = path.startsWith("/") ? path.substring(1) : path;
      return `${normalizedBase}/${normalizedPath}`;
    },
    getPostShareUrl: (postId: number | string): string =>
      config.app.getFullUrl(`post/${postId}`),
    getProfileUrl: (username: string): string =>
      config.app.getFullUrl(`profile/${username}`),
    getCollectionUrl: (collectionId: number | string): string =>
      config.app.getFullUrl(`collections/${collectionId}`),
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
    if (config.isInitialized) return;
    if (process.env.NODE_ENV === "development") {
      console.log("🔧 App Configuration:", {
        API_URL: config.api.API_URL,
        APP_URL: config.app.APP_URL,
        HAS_SERVER_API_TOKEN: !!API_TOKEN,
        FEATURES: config.features,
      });
    }
    config.isInitialized = true;
  },
};

config.initialize();

export function useSampleData(): boolean {
  return false;
}

export default config;
