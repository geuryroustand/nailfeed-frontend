"use client"

import type { User as AuthUser } from "@/lib/auth/auth-service"

export type UserProfile = AuthUser

export type UpdateProfileInput = Partial<{
  username: string
  displayName: string
  bio: string
  location: string
  website: string
}>

async function fetchSessionUser(forceRefresh = false): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: forceRefresh ? "no-store" : "default",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.authenticated ? (data.user as UserProfile) : null
  } catch (error) {
    console.error("[ProfileService] Failed to fetch session user:", error)
    return null
  }
}

export const ProfileService = {
  async getProfile(forceRefresh = false): Promise<UserProfile | null> {
    return fetchSessionUser(forceRefresh)
  },

  async updateProfile(profileData: UpdateProfileInput): Promise<UserProfile | null> {
    try {
      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          endpoint: "/api/users/me",
          method: "PUT",
          data: profileData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message =
          errorData?.error?.message || errorData?.message || "Failed to update profile"
        throw new Error(message)
      }

      // Ensure we return the latest user data from the session
      return await fetchSessionUser(true)
    } catch (error) {
      console.error("[ProfileService] Failed to update profile:", error)
      throw error instanceof Error ? error : new Error("Failed to update profile")
    }
  },
}

export default ProfileService
