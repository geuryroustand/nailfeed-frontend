export type SocialProvider = 'google' | 'facebook' | 'instagram'

export class SocialAuthService {
  private static getBaseUrl(): string {
    // Use localhost in development, otherwise use the API_URL
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' 
        ? 'http://localhost:1337'
        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'
    }
    return process.env.API_URL || 'http://localhost:1337'
  }

  private static getCallbackUrl(provider: SocialProvider): string {
    // Use localhost in development for the frontend callback
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      return `${baseUrl}/auth/callback/${provider}`
    }
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback/${provider}`
  }

  static initiateSocialLogin(provider: SocialProvider): void {
    const baseUrl = this.getBaseUrl()
    const callbackUrl = this.getCallbackUrl(provider)
    
    // Strapi's OAuth URL format
    const authUrl = `${baseUrl}/api/connect/${provider}?callback=${encodeURIComponent(callbackUrl)}`
    
    console.log(`Initiating ${provider} login:`, authUrl)
    
    // Redirect to Strapi's OAuth endpoint
    window.location.href = authUrl
  }

  static async handleCallback(provider: SocialProvider, accessToken: string): Promise<{
    success: boolean
    user?: any
    jwt?: string
    error?: string
  }> {
    try {
      const baseUrl = this.getBaseUrl()
      
      // Exchange access token for user data and JWT from Strapi
      const response = await fetch(`${baseUrl}/api/auth/${provider}/callback?access_token=${accessToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `${provider} authentication failed`)
      }

      const data = await response.json()
      
      if (data.jwt && data.user) {
        // Store JWT in localStorage for client-side access
        localStorage.setItem('auth_token', data.jwt)
        
        // Also set HTTP-only cookie via API route
        await fetch('/api/auth/set-cookie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: data.jwt }),
        }).catch(err => console.error('Failed to set cookie:', err))

        return {
          success: true,
          user: data.user,
          jwt: data.jwt,
        }
      } else {
        throw new Error('Invalid response from authentication server')
      }
    } catch (error) {
      console.error(`${provider} callback error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }
    }
  }
}
