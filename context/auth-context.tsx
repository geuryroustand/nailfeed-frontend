"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/app/actions/auth-actions"

type User = {
  id: number
  username: string
  email: string
  displayName?: string
  profileImage?: any
  [key: string]: any
}

type AuthContextType = {
  user: User | null
  jwt: string | null
  isLoading: boolean
  isAuthenticated: boolean
  checkAuthStatus: () => Promise<void>
  logout: () => Promise<void>
  setUserData: (userData: User, token?: string) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [jwt, setJwt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const isCheckingAuth = useRef(false)

  const checkAuthStatus = useCallback(async () => {
    if (isCheckingAuth.current) return

    isCheckingAuth.current = true
    setIsLoading(true)

    try {
      console.log("[v0] Checking auth status via server...")

      const userData = await getCurrentUser()

      if (userData) {
        console.log("[v0] User authenticated, updating UI state:", userData)
        const { _jwt, ...userDataWithoutJwt } = userData
        setUser(userDataWithoutJwt)
        setJwt(_jwt || null)
        setIsAuthenticated(true)

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userDataWithoutJwt))
          if (_jwt) {
            localStorage.setItem("jwt", _jwt)
          }
        }

        console.log("[v0] JWT token set in context:", !!_jwt)
      } else {
        console.log("[v0] No authenticated user found, clearing state")
        setUser(null)
        setJwt(null)
        setIsAuthenticated(false)

        if (typeof window !== "undefined") {
          localStorage.removeItem("user")
          localStorage.removeItem("jwt")
        }
      }
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      setUser(null)
      setJwt(null)
      setIsAuthenticated(false)

      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
        localStorage.removeItem("jwt")
      }
    } finally {
      setIsLoading(false)
      isCheckingAuth.current = false
    }
  }, [])

  const logout = async () => {
    setUser(null)
    setJwt(null)
    setIsAuthenticated(false)

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      const cookiesToClear = ["authToken", "jwt", "auth_token", "userId", "pendingVerificationEmail", "user", "session"]

      cookiesToClear.forEach((cookieName) => {
        // Clear with multiple path and domain combinations to ensure complete removal
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; domain=${window.location.hostname};`
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; domain=.${window.location.hostname};`
      })

      router.push("/auth")
      router.refresh()

      // Additional cleanup - clear any localStorage/sessionStorage if used
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
        localStorage.removeItem("jwt")
        localStorage.removeItem("authToken")
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("jwt")
        sessionStorage.removeItem("authToken")
      }
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/auth")
      router.refresh()
    }
  }

  const setUserData = (userData: User, token?: string) => {
    console.log("[v0] Setting user data in context:", userData)
    console.log("[v0] Setting JWT token in context:", !!token)

    if (userData) {
      setUser(userData)
      setIsAuthenticated(true)
      setJwt(token || null)

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData))
        if (token) {
          localStorage.setItem("jwt", token)
        }
      }
    }
  }

  const refreshUser = async () => {
    return checkAuthStatus()
  }

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const value = {
    user,
    jwt,
    isLoading,
    isAuthenticated,
    checkAuthStatus,
    logout,
    setUserData,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
