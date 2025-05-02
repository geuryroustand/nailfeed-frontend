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
  const { token, user } = useAuth()

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const profileData = await ProfileService.getProfile(token)
      setProfile(profileData)
      return profileData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load profile"
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    return fetchProfile()
  }, [fetchProfile])

  // Update profile
  const updateProfile = useCallback(
    async (profileData: UpdateProfileInput): Promise<UserProfile | null> => {
      if (!token) return null

      setIsLoading(true)
      setError(null)

      try {
        const updatedProfile = await ProfileService.updateProfile(token, profileData)
        if (updatedProfile) {
          setProfile(updatedProfile)
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
    [token],
  )

  // Fetch profile on mount or when token changes
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
