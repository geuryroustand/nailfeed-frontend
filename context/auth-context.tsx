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
        setUser(userData)
        setIsAuthenticated(true)
        setJwt("authenticated")
      } else {
        console.log("[v0] No authenticated user found, clearing state")
        setUser(null)
        setJwt(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      setUser(null)
      setJwt(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
      isCheckingAuth.current = false
    }
  }, [])

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      setUser(null)
      setJwt(null)
      setIsAuthenticated(false)

      document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
      document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
      document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"

      router.push("/auth")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      setUser(null)
      setJwt(null)
      setIsAuthenticated(false)
      router.push("/auth")
    }
  }

  const setUserData = (userData: User, token?: string) => {
    console.log("[v0] Setting user data in context:", userData)

    if (userData) {
      setUser(userData)
      setIsAuthenticated(true)
      setJwt("authenticated")
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
