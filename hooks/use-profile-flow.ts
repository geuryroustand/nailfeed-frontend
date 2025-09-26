"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/context/profile-context"

export function useProfileFlow() {
  const [isInitializing, setIsInitializing] = useState(true)
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { profile, isLoading: profileLoading, checkAndCreateProfile } = useProfile()
  const router = useRouter()

  useEffect(() => {
    const initializeProfile = async () => {
      if (!authLoading && isAuthenticated && user) {
        // Check and create profile if needed
        const profileResult = await checkAndCreateProfile()

        // If no profile was created/found, user needs to create one
        if (!profileResult) {
          setNeedsProfileCreation(true)
        } else {
          setNeedsProfileCreation(false)
        }

        setIsInitializing(false)
      } else if (!authLoading && !isAuthenticated) {
        // Not authenticated, no need to check profile
        setIsInitializing(false)
        setNeedsProfileCreation(false)
      }
    }

    initializeProfile()
  }, [authLoading, isAuthenticated, user])

  // Redirect to profile creation if needed
  useEffect(() => {
    if (!isInitializing && needsProfileCreation && isAuthenticated) {
      router.push("/onboarding/profile")
    }
  }, [isInitializing, needsProfileCreation, isAuthenticated, router])

  return {
    isInitializing: isInitializing || authLoading || profileLoading,
    needsProfileCreation,
    profile,
  }
}
