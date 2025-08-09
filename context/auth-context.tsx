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

  // Function to get cookie value by name
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null

    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null
    return null
  }

  // Function to set a cookie
  const setCookie = (name: string, value: string, days = 7) => {
    if (typeof document === "undefined") return

    const maxAge = days * 24 * 60 * 60
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax;`
  }

  const checkAuthStatus = useCallback(async () => {
    // Prevent concurrent auth checks
    if (isCheckingAuth.current) return

    isCheckingAuth.current = true
    setIsLoading(true)

    try {
      console.log("Checking auth status...")

      // Try to get token from cookie - check all possible formats
      const token = getCookie("authToken") || getCookie("jwt") || getCookie("auth_token")

      if (token) {
        console.log("Found token in cookie:", token.substring(0, 10) + "...")
        setJwt(token)

        // Verify token with server
        const userData = await getCurrentUser()

        if (userData) {
          console.log("User authenticated:", userData)
          setUser(userData)
          setIsAuthenticated(true)

          // Ensure the token is available in all cookie formats for compatibility
          if (!getCookie("jwt")) {
            setCookie("jwt", token, 7)
          }
          if (!getCookie("authToken")) {
            setCookie("authToken", token, 7)
          }
          if (!getCookie("auth_token")) {
            setCookie("auth_token", token, 7)
          }

          // Also store user ID in cookie for easier access
          if (userData.id) {
            setCookie("userId", userData.id.toString(), 7)
          }
        } else {
          console.log("No authenticated user found")
          setUser(null)
          setJwt(null)
          setIsAuthenticated(false)

          // Clear the cookies if the token is invalid
          document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
          document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
          document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
          document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
        }
      } else {
        console.log("No token found in cookies")
        setUser(null)
        setJwt(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setUser(null)
      setJwt(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
      isCheckingAuth.current = false
    }
  }, [])

  // Simplified logout function
  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      // Update client state
      setUser(null)
      setJwt(null)
      setIsAuthenticated(false)

      // Clear cookies on client side
      document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
      document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"
      document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;"

      // Redirect to auth page
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

  // Function to set user data on the client side
  const setUserData = (userData: User, token?: string) => {
    console.log("Setting user data in context:", userData)

    if (userData) {
      setUser(userData)
      setIsAuthenticated(true)

      if (token) {
        console.log("Setting JWT in context:", token.substring(0, 10) + "...")
        setJwt(token)

        // Set the token in all cookie formats for compatibility
        setCookie("authToken", token, 7)
        setCookie("jwt", token, 7)
        setCookie("auth_token", token, 7)

        // Also store user ID in cookie for easier access
        if (userData.id) {
          setCookie("userId", userData.id.toString(), 7)
        }
      }
    }
  }

  // Function to refresh user data
  const refreshUser = async () => {
    return checkAuthStatus()
  }

  // Check auth status when the component mounts
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
