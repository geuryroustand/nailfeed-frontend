"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useAuth } from "@/context/auth-context"
import { ProfileService, type UserProfile, type UpdateProfileInput } from "@/lib/profile-service"

interface ProfileContextType {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  updateProfile: (profileData: UpdateProfileInput) => Promise<UserProfile | null>
  refreshProfile: () => Promise<UserProfile | null>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated, refreshUser } = useAuth()

  // Fetch profile data
  const fetchProfile = useCallback(
    async (forceRefresh = false) => {
      if (!isAuthenticated) {
        setProfile(null)
        setIsLoading(false)
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const profileData = await ProfileService.getProfile(forceRefresh)
        setProfile(profileData)
        return profileData
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load profile"
        setError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated],
  )

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    return fetchProfile(true) // Pass true to force a fresh fetch
  }, [fetchProfile])

  // Update profile
  const updateProfile = useCallback(
    async (profileData: UpdateProfileInput): Promise<UserProfile | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const updatedProfile = await ProfileService.updateProfile(profileData)
        if (updatedProfile) {
          setProfile(updatedProfile)
          await refreshUser()
        }
        return updatedProfile
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update profile"
        setError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUser],
  )

  // Fetch profile on mount or when token changes
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile, isAuthenticated])

  useEffect(() => {
    if (user) {
      setProfile(user as UserProfile)
    } else {
      setProfile(null)
    }
  }, [user])

  const value = {
    profile,
    isLoading,
    error,
    updateProfile,
    refreshProfile,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}
