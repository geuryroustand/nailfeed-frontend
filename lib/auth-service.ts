import { toast } from "@/hooks/use-toast"

// Types for authentication
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
  isVerified?: boolean
  followersCount?: number
  followingCount?: number
  postsCount?: number
}

export interface AuthResponse {
  jwt: string
  user: User
}

export interface TokenData {
  token: string
  expiresAt: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

// Token expiration buffer (5 minutes in milliseconds)
const TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000

// Authentication service
export const AuthService = {
  // Register a new user
  async register(username: string, email: string, password: string): Promise<AuthResponse | null> {
    try {
      // Use API if available, otherwise use mock data
      if (!API_URL) {
        const mockResponse = {
          jwt: "mock-jwt-token",
          user: {
            id: 1,
            username,
            email,
            displayName: username,
          },
        }

        if (mockResponse?.jwt) {
          this.storeTokenInCookie(mockResponse.jwt)
        }
        return mockResponse
      }

      const response = await fetch(`${API_URL}/api/auth/local/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Registration failed")
      }

      const data = await response.json()

      // Keep the token storage logic
      if (data?.jwt) {
        this.storeTokenInCookie(data.jwt)
      }
      return data
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return null
    }
  },

  // Login user
  async login(identifier: string, password: string): Promise<AuthResponse | { error: string } | null> {
    try {
      // Use API if available, otherwise use mock data
      if (!API_URL) {
        const mockData = {
          jwt: "mock-jwt-token",
          user: {
            id: 1,
            username: identifier,
            email: identifier.includes("@") ? identifier : `${identifier}@example.com`,
            displayName: identifier,
          },
        }

        if (mockData?.jwt) {
          this.storeTokenInCookie(mockData.jwt)
        }
        return mockData
      }

      const response = await fetch(`${API_URL}/api/auth/local`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Extract the exact error message from Strapi response
        let errorMessage = "Login failed"

        if (errorData.error) {
          if (errorData.error.message) {
            errorMessage = errorData.error.message
          } else if (typeof errorData.error === "string") {
            errorMessage = errorData.error
          }
        }

        // Return the exact error message from the backend
        return { error: errorMessage }
      }

      const data = await response.json()

      if (data?.jwt) {
        this.storeTokenInCookie(data.jwt)
      }
      return data
    } catch (error) {
      return { error: error instanceof Error ? error.message : "An unknown error occurred" }
    }
  },

  // Request password reset
  async forgotPassword(email: string): Promise<boolean> {
    try {
      // Use API if available, otherwise use mock data
      if (!API_URL) {
        return true
      }

      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Password reset request failed")
      }

      return true
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return false
    }
  },

  // Reset password with token
  async resetPassword(code: string, password: string, passwordConfirmation: string): Promise<AuthResponse | null> {
    try {
      // Use API if available, otherwise use mock data
      if (!API_URL) {
        const mockData = {
          jwt: "mock-jwt-token",
          user: {
            id: 1,
            username: "resetuser",
            email: "reset@example.com",
          },
        }
        return mockData
      }

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Password reset failed")
      }

      const data = await response.json()
      return data
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return null
    }
  },

  // Send email verification
  async sendEmailConfirmation(email: string): Promise<boolean> {
    // Just return true without sending email
    return true
  },

  // Confirm email with token
  async confirmEmail(confirmationToken: string): Promise<boolean> {
    try {
      // Use API if available, otherwise use mock data
      if (!API_URL) {
        return true
      }

      const response = await fetch(`${API_URL}/api/auth/email-confirmation?confirmation=${confirmationToken}`, {
        method: "GET",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Email confirmation failed with status: ${response.status}`)
      }

      return true
    } catch (error: any) {
      toast({
        title: "Email confirmation failed",
        description: error instanceof Error ? error.message : `An unknown error occurred: ${error}`,
        variant: "destructive",
      })
      return false
    }
  },

  // Get current user profile
  async getCurrentUser(token: string): Promise<User | null> {
    try {
      // Use API if available, otherwise use mock data
      if (!API_URL) {
        const mockData = {
          id: 1,
          username: "currentuser",
          email: "user@example.com",
          displayName: "Current User",
          bio: "This is a mock user profile",
          profileImage: {
            url: "/serene-woman-gaze.png",
          },
        }
        return mockData
      }

      const response = await fetch(`${API_URL}/api/users/me?populate=profileImage`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          return null
        }
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to get user profile")
      }

      const data = await response.json()
      return data
    } catch (error) {
      return null
    }
  },

  // Update user profile
  async updateProfile(token: string, userData: Partial<User>): Promise<User | null> {
    try {
      // Use API if available, otherwise use mock data
      if (!API_URL) {
        const mockData = {
          id: 1,
          username: "currentuser",
          email: "user@example.com",
          ...userData,
        }
        return mockData
      }

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to update profile")
      }

      const data = await response.json()
      return data
    } catch (error) {
      toast({
        title: "Profile update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return null
    }
  },

  // Upload profile image
  async uploadProfileImage(token: string, userId: number, file: File): Promise<boolean> {
    try {
      // Use API if available, otherwise use mock data
      if (!API_URL) {
        return true
      }

      const formData = new FormData()
      formData.append("files", file)
      formData.append("ref", "plugin::users-permissions.user")
      formData.append("refId", userId.toString())
      formData.append("field", "profileImage")

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to upload image")
      }

      return true
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return false
    }
  },

  // Parse JWT token to get expiration time
  parseJwt(token: string): { exp: number } | null {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      return null
    }
  },

  // Check if token is about to expire
  isTokenExpiringSoon(token: string): boolean {
    const parsed = this.parseJwt(token)
    if (!parsed) return true

    const expirationTime = parsed.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()

    // Token is expiring soon if it's within the buffer time
    return expirationTime - currentTime < TOKEN_EXPIRATION_BUFFER
  },

  // Store token in cookie
  storeTokenInCookie(token: string): void {
    // This function will be called from the client side
    console.log("Storing JWT in cookie:", token)

    // Set the token in a cookie
    const maxAge = 60 * 60 * 24 * 7 // 7 days
    document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax;`

    // Also set the cookie via the server API to ensure it's properly set
    fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    }).catch((error) => {
      console.error("Error setting cookie via API:", error)
    })
  },
}
