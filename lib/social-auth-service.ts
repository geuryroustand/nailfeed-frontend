interface SocialAuthConfig {
  provider: string
  clientUrl: string
  apiUrl: string
}

export class SocialAuthService {
  private static getConfig(): SocialAuthConfig {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return {
      provider: 'google',
      clientUrl: isDevelopment ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app',
      apiUrl: isDevelopment ? 'http://localhost:1337' : process.env.API_URL || 'https://your-strapi-api.com'
    }
  }

  static initiateGoogleAuth(): void {
    const config = this.getConfig()
    const callbackUrl = `${config.clientUrl}/auth/callback/google`
    const strapiAuthUrl = `${config.apiUrl}/api/connect/google?callback=${encodeURIComponent(callbackUrl)}`
    
    console.log('Initiating Google OAuth with:', {
      callbackUrl,
      strapiAuthUrl,
      isDevelopment: process.env.NODE_ENV === 'development'
    })
    
    // Redirect to Strapi's Google OAuth endpoint
    window.location.href = strapiAuthUrl
  }

  static initiateFacebookAuth(): void {
    const config = this.getConfig()
    const callbackUrl = `${config.clientUrl}/auth/callback/facebook`
    const strapiAuthUrl = `${config.apiUrl}/api/connect/facebook?callback=${encodeURIComponent(callbackUrl)}`
    
    console.log('Initiating Facebook OAuth with:', {
      callbackUrl,
      strapiAuthUrl,
      isDevelopment: process.env.NODE_ENV === 'development'
    })
    
    // Redirect to Strapi's Facebook OAuth endpoint
    window.location.href = strapiAuthUrl
  }

  static async handleCallback(provider: string, accessToken: string): Promise<{
    success: boolean
    user?: any
    jwt?: string
    error?: string
  }> {
    try {
      const config = this.getConfig()
      
      console.log(`Handling ${provider} callback with token:`, accessToken.substring(0, 20) + '...')
      
      // Exchange access token for user data and JWT from Strapi
      const response = await fetch(`${config.apiUrl}/api/auth/${provider}/callback?access_token=${accessToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`${provider} callback failed:`, errorText)
        throw new Error(`Authentication failed: ${response.status}`)
      }

      const data = await response.json()
      
      console.log(`${provider} authentication successful:`, {
        hasUser: !!data.user,
        hasJwt: !!data.jwt,
        userId: data.user?.id
      })

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
        })

        return {
          success: true,
          user: data.user,
          jwt: data.jwt
        }
      } else {
        throw new Error('Invalid response from authentication server')
      }
    } catch (error) {
      console.error(`${provider} authentication error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  static async logout(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.removeItem('auth_token')
      
      // Clear HTTP-only cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
}
