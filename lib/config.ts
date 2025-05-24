interface Config {
  apiUrl: string
  appUrl: string
  enableComments: boolean
  enableReactions: boolean
  enableSocialAuth: boolean
  enableAnalytics: boolean
  useSampleData: boolean
  revalidateSecret: string
  webhookSecret: string
  apiToken: string
  initialized: boolean
}

class ConfigManager {
  private config: Config | null = null

  initialize(): Config {
    if (this.config && this.config.initialized) {
      return this.config
    }

    // Safely get environment variables with fallbacks
    const getEnvVar = (key: string, fallback = ""): string => {
      if (typeof window !== "undefined") {
        // Client-side: only access NEXT_PUBLIC_ variables
        if (key.startsWith("NEXT_PUBLIC_")) {
          return process.env[key] || fallback
        }
        return fallback
      }
      // Server-side: can access all variables
      return process.env[key] || fallback
    }

    const getBooleanEnvVar = (key: string, fallback = false): boolean => {
      const value = getEnvVar(key)
      if (!value) return fallback
      return value.toLowerCase() === "true" || value === "1"
    }

    this.config = {
      apiUrl: getEnvVar("API_URL", "http://localhost:1337/api"),
      appUrl: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
      enableComments: getBooleanEnvVar("NEXT_PUBLIC_ENABLE_COMMENTS", true),
      enableReactions: getBooleanEnvVar("NEXT_PUBLIC_ENABLE_REACTIONS", true),
      enableSocialAuth: getBooleanEnvVar("NEXT_PUBLIC_ENABLE_SOCIAL_AUTH", false),
      enableAnalytics: getBooleanEnvVar("NEXT_PUBLIC_ENABLE_ANALYTICS", false),
      useSampleData: getBooleanEnvVar("NEXT_PUBLIC_USE_SAMPLE_DATA", true),
      revalidateSecret: getEnvVar("REVALIDATE_SECRET", "default-secret"),
      webhookSecret: getEnvVar("WEBHOOK_SECRET", "default-webhook-secret"),
      apiToken: getEnvVar("API_TOKEN", ""),
      initialized: true,
    }

    return this.config
  }

  get(): Config {
    if (!this.config || !this.config.initialized) {
      return this.initialize()
    }
    return this.config
  }

  // Safe getters that won't throw errors
  getApiUrl(): string {
    try {
      return this.get().apiUrl
    } catch {
      return "http://localhost:1337/api"
    }
  }

  getAppUrl(): string {
    try {
      return this.get().appUrl
    } catch {
      return "http://localhost:3000"
    }
  }

  shouldUseSampleData(): boolean {
    try {
      return this.get().useSampleData
    } catch {
      return true
    }
  }
}

const config = new ConfigManager()

export default config
