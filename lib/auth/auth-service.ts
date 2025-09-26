"use client"

/**
 * ✅ CONSOLIDATED AUTHENTICATION SERVICE
 * Single source of truth for all authentication operations
 * Combines secure server-side session management with social auth and profile features
 *
 * Architecture:
 * - Uses server actions and secure API endpoints
 * - No client-side token storage or manipulation
 * - Unified TypeScript interfaces
 * - Comprehensive error handling
 */

// ✅ UNIFIED: Single User interface consolidating all service variations
export interface User {
  id: number
  username: string
  email: string
  displayName?: string
  bio?: string
  location?: string
  website?: string
  profileImage?: {
    url: string
  }
  coverImage?: {
    url: string
  }
  isVerified?: boolean
  followersCount?: number
  followingCount?: number
  postsCount?: number
  provider?: string
  confirmed?: boolean
  blocked?: boolean
  createdAt?: string
  updatedAt?: string
}

// ✅ UNIFIED: Consolidated authentication interfaces
export interface LoginCredentials {
  identifier: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
  jwt?: string // For legacy compatibility
}

export interface UpdateProfileData {
  displayName?: string
  bio?: string
  location?: string
  website?: string
}

// ✅ SOCIAL AUTH: Social provider types
export type SocialProvider = "google" | "facebook" | "instagram"

export interface SocialAuthResponse extends AuthResponse {
  provider?: SocialProvider
}

/**
 * Client-side authentication service
 * All operations go through secure server endpoints
 */
export const AuthService = {
  /**
   * Login user using secure server endpoint
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Login failed",
        }
      }

      return {
        success: true,
        user: data.user,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // Get Strapi URL for registration (public endpoint)
      const strapiUrl = process.env.NEXT_PUBLIC_API_URL ||
                       "https://nailfeed-backend-production.up.railway.app"

      const response = await fetch(`${strapiUrl}/api/auth/local/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || "Registration failed",
        }
      }

      // After successful registration, create session
      if (data.jwt && data.user) {
        const loginResult = await this.login({
          identifier: credentials.email,
          password: credentials.password,
        })
        return loginResult
      }

      return {
        success: true,
        user: data.user,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        return {
          success: false,
          error: "Logout failed",
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  /**
   * Get current user session
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.authenticated ? data.user : null
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return !!user
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_API_URL ||
                       "https://nailfeed-backend-production.up.railway.app"

      const response = await fetch(`${strapiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || "Password reset request failed",
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(
    code: string,
    password: string,
    passwordConfirmation: string
  ): Promise<AuthResponse> {
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_API_URL ||
                       "https://nailfeed-backend-production.up.railway.app"

      const response = await fetch(`${strapiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          password,
          passwordConfirmation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || "Password reset failed",
        }
      }

      // After successful password reset, create session
      if (data.jwt && data.user) {
        const loginResult = await this.login({
          identifier: data.user.email,
          password,
        })
        return loginResult
      }

      return {
        success: true,
        user: data.user,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  // ✅ SOCIAL AUTH: Social authentication methods
  /**
   * Get authorization URL for social providers
   */
  getSocialAuthUrl(provider: SocialProvider, redirectUri?: string): string {
    const strapiUrl = process.env.NEXT_PUBLIC_API_URL ||
                     "https://nailfeed-backend-production.up.railway.app"

    // For Instagram, use Facebook provider since Instagram auth is through Facebook
    const actualProvider = provider === "instagram" ? "facebook" : provider

    // Build redirect URI
    const defaultRedirectUri = `${window.location.origin}/auth/callback/${provider}`
    const finalRedirectUri = redirectUri || defaultRedirectUri
    const encodedRedirectUri = encodeURIComponent(finalRedirectUri)

    return `${strapiUrl}/api/connect/${actualProvider}?callback=${encodedRedirectUri}`
  },

  /**
   * Handle social authentication callback
   */
  async handleSocialCallback(
    provider: SocialProvider,
    code: string,
    redirectUri?: string
  ): Promise<SocialAuthResponse> {
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_API_URL ||
                       "https://nailfeed-backend-production.up.railway.app"

      // For Instagram, use Facebook provider since Instagram auth is through Facebook
      const actualProvider = provider === "instagram" ? "facebook" : provider

      const defaultRedirectUri = `${window.location.origin}/auth/callback/${provider}`
      const finalRedirectUri = redirectUri || defaultRedirectUri

      const response = await fetch(`${strapiUrl}/api/auth/${actualProvider}/callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          redirect_uri: finalRedirectUri,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `${provider} authentication failed`,
          provider,
        }
      }

      // Create session through login endpoint after social auth
      if (data.jwt && data.user) {
        // Use secure session endpoint to validate social login
        const sessionResponse = await fetch("/api/auth/social-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jwt: data.jwt,
            user: data.user,
            provider,
          }),
        })

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          return {
            success: true,
            user: sessionData.user,
            provider,
          }
        }
      }

      return {
        success: false,
        error: "Failed to create secure session after social login",
        provider,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        provider,
      }
    }
  },

  // ✅ PROFILE MANAGEMENT: Enhanced profile features
  /**
   * Update user profile information
   */
  async updateProfile(profileData: UpdateProfileData): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/api/users/me",
          method: "PUT",
          data: profileData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || "Failed to update profile",
        }
      }

      return {
        success: true,
        user: data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  /**
   * Upload profile image
   */
  async uploadProfileImage(file: File): Promise<AuthResponse> {
    try {
      const formData = new FormData()
      formData.append("files", file)
      formData.append("ref", "plugin::users-permissions.user")
      formData.append("field", "profileImage")

      // Get current user ID from session first
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return {
          success: false,
          error: "User not authenticated",
        }
      }

      formData.append("refId", currentUser.id.toString())

      const response = await fetch("/api/auth-proxy/upload", {
        method: "POST",
        body: formData, // Don't set Content-Type for FormData
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error?.message || "Failed to upload image",
        }
      }

      // Refresh user data to get updated profile image
      const updatedUser = await this.getCurrentUser()
      return {
        success: true,
        user: updatedUser || undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  /**
   * Send email confirmation
   */
  async sendEmailConfirmation(email: string): Promise<AuthResponse> {
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_API_URL ||
                       "https://nailfeed-backend-production.up.railway.app"

      const response = await fetch(`${strapiUrl}/api/auth/send-email-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error?.message || "Failed to send confirmation email",
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  /**
   * Confirm email with token
   */
  async confirmEmail(confirmationToken: string): Promise<AuthResponse> {
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_API_URL ||
                       "https://nailfeed-backend-production.up.railway.app"

      const response = await fetch(
        `${strapiUrl}/api/auth/email-confirmation?confirmation=${confirmationToken}`,
        {
          method: "GET",
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error?.message || "Email confirmation failed",
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  },

  // ✅ UTILITY: Helper methods for backward compatibility
  /**
   * Legacy token storage methods (deprecated - use for migration only)
   * @deprecated Use server-side session management instead
   */
  storeToken(token: string): void {
    console.warn("storeToken is deprecated. Use server-side session management instead.")
    // No-op for security
  },

  /**
   * @deprecated Use getCurrentUser() instead
   */
  getToken(): string | null {
    console.warn("getToken is deprecated. Use server-side session management instead.")
    return null
  },

  /**
   * @deprecated Use logout() instead
   */
  removeToken(): void {
    console.warn("removeToken is deprecated. Use logout() instead.")
    // No-op for security
  },

  /**
   * @deprecated Use server-side session validation instead
   */
  storeTokenInCookie(token: string): void {
    console.warn("storeTokenInCookie is deprecated. Use server-side session management instead.")
    // No-op for security
  },
}
