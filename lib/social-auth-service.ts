export type SocialProvider = "google" | "facebook" | "instagram"

export class SocialAuthService {
  private static getBaseUrl(): string {
    // Use localhost in development, otherwise use the configured app URL
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3000"
    }
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }

  private static getApiUrl(): string {
    // Use localhost API in development
    if (process.env.NODE_ENV === "development") {
      return process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"
  }

  static initiateSocialLogin(provider: SocialProvider): void {
    const baseUrl = this.getBaseUrl()
    const apiUrl = this.getApiUrl()
    
    // Construct the callback URL that Strapi will redirect to after authentication
    const callbackUrl = `${baseUrl}/auth/callback/${provider}`
    
    // Strapi's social auth endpoint
    const authUrl = `${apiUrl}/api/connect/${provider}?callback=${encodeURIComponent(callbackUrl)}`
    
    // Redirect to Strapi's social auth endpoint
    window.location.href = authUrl
  }

  static async handleCallback(provider: SocialProvider, searchParams: URLSearchParams): Promise<{
    success: boolean
    user?: any
    jwt?: string
    error?: string
  }> {
    try {
      const accessToken = searchParams.get('access_token')
      
      if (!accessToken) {
        return {
          success: false,
          error: "No access token received from provider"
        }
      }

      const apiUrl = this.getApiUrl()
      
      // Exchange the access token for user data and JWT from Strapi
      const response = await fetch(`${apiUrl}/api/auth/${provider}/callback?access_token=${accessToken}`)
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.jwt && data.user) {
        return {
          success: true,
          user: data.user,
          jwt: data.jwt
        }
      } else {
        return {
          success: false,
          error: "Invalid response from authentication server"
        }
      }
    } catch (error) {
      console.error(`${provider} callback error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed"
      }
    }
  }
}
