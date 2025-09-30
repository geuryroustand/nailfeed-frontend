"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"

// Shared user shape for UI state only
export type AuthUser = {
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

// Context surface focuses purely on UI concerns
export type AuthContextType = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
  clearUserState: (options?: { redirect?: boolean }) => void
  setUserState: (nextUser: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  initialUser?: AuthUser | null
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const router = useRouter()

  const isAuthenticated = useMemo(() => !!user, [user])

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.authenticated && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    setIsLoading(true)
    await fetchUserData()
  }, [fetchUserData])

  const clearUserState = useCallback(
    (options?: { redirect?: boolean }) => {
      setUser(null)
      setIsLoading(false)

      if (options?.redirect !== false) {
        router.push("/auth")
        router.refresh()
      }
    },
    [router]
  )

  const setUserState = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser)
  }, [])

  useEffect(() => {
    if (!initialUser) {
      fetchUserData()
    }
  }, [fetchUserData, initialUser])

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      refreshUser,
      clearUserState,
      setUserState,
    }),
    [user, isLoading, isAuthenticated, refreshUser, clearUserState, setUserState]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
