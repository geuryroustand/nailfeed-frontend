import { toast } from "@/hooks/use-toast"

export interface User {
  id: number
  username: string
  email: string
  provider?: string
  confirmed?: boolean
  blocked?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  jwt: string
  user: User
}

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
}

export interface AuthError {
  statusCode: number
  error: string
  message: string
}

// Use NEXT_PUBLIC_APP_URL instead of API_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const AuthService = {
  async register(credentials: RegisterCredentials): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData: AuthError = await response.json()
        throw new Error(errorData.message || "Registration failed")
      }

      return await response.json()
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return null
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData: AuthError = await response.json()
        throw new Error(errorData.message || "Login failed")
      }

      return await response.json()
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      return null
    }
  },

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user")
      }

      return await response.json()
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  },

  storeToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  },

  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },
}
