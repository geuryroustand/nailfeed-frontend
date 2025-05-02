import type { AuthResponse } from "./auth-service"
import { toast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"

// Social authentication providers
export type SocialProvider = "google" | "facebook" | "instagram"

export const SocialAuthService = {
  // Get the authorization URL for the specified provider
  getAuthorizationUrl(provider: SocialProvider, redirectUri: string): string {
    // For Instagram, we use Facebook provider since Instagram auth is through Facebook
    const actualProvider = provider === "instagram" ? "facebook" : provider

    // Encode the redirect URI
    const encodedRedirectUri = encodeURIComponent(redirectUri)

    // Return the authorization URL
    return `${API_URL}/api/connect/${actualProvider}?callback=${encodedRedirectUri}`
  },

  // Handle the callback from the social provider
  async handleCallback(provider: SocialProvider, code: string, redirectUri: string): Promise<AuthResponse | null> {
    try {
      // For Instagram, we use Facebook provider since Instagram auth is through Facebook
      const actualProvider = provider === "instagram" ? "facebook" : provider

      // Make the request to exchange the code for a token
      const response = await fetch(`${API_URL}/api/auth/${actualProvider}/callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          redirect_uri: redirectUri,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `${provider} authentication failed`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`${provider} authentication error:`, error)
      toast({
        title: `${provider} authentication failed`,
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return null
    }
  },

  // Initialize the social login process
  initiateSocialLogin(provider: SocialProvider): void {
    // Get the current URL for the redirect
    const redirectUri = `${window.location.origin}/auth/callback/${provider}`

    // Get the authorization URL
    const authUrl = this.getAuthorizationUrl(provider, redirectUri)

    // Redirect to the authorization URL
    window.location.href = authUrl
  },
}
