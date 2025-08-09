import { toast } from "@/hooks/use-toast"
import type { User } from "@/lib/auth-service"

export interface UserProfile {
  id: number
  username: string
  email: string
  displayName: string
  bio: string
  location: string
  website: string
  profileImage?: {
    url: string
  }
  coverImage?: {
    url: string
  }
  isVerified: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  preferences?: {
    emailNotifications: boolean
    pushNotifications: boolean
    profileVisibility: "public" | "private" | "followers"
  }
  createdAt: string
  updatedAt: string
}

// Update the UpdateProfileInput type to include only fields that can be updated
export type UpdateProfileInput = Partial<{
  displayName: string
  bio: string
  location: string
  website: string
  username: string
  preferences?: {
    emailNotifications: boolean
    pushNotifications: boolean
    profileVisibility: "public" | "private" | "followers"
  }
}>

// Use NEXT_PUBLIC_APP_URL instead of API_URL
const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Helper function to build API endpoints correctly
const buildApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with a single slash
  const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  return `${API_URL}${formattedEndpoint}`
}

export const ProfileService = {
  // Get user profile
  async getProfile(token: string, forceRefresh = false): Promise<UserProfile | null> {
    try {
      // Validate inputs
      if (!token) {
        console.warn("Missing token in getProfile")
        return null
      }

      // Check if we're on an auth page - but exclude settings pages
      if (typeof window !== "undefined") {
        const path = window.location.pathname
        // Only skip on login/register pages, not on settings or other pages
        if (path === "/auth" || path === "/auth/login" || path === "/auth/register") {
          console.log("Skipping profile fetch on auth login/register page")
          return null
        }
      }

      // Build the correct API URL
      // Add a cache-busting query parameter when forceRefresh is true
      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : ""
      const apiUrl = buildApiUrl(`/api/users/me?${cacheBuster}`)
      console.log(`Fetching user profile from ${apiUrl}`)

      // Create a timeout for the request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          signal: controller.signal,
          cache: "no-store", // Ensure we don't use cached data
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Could not read error response")
          console.error(`API error response: ${response.status} ${response.statusText}`, errorText)

          let errorMessage = `API error: ${response.status} ${response.statusText}`
          try {
            // Try to parse as JSON to get a more specific error message
            const errorData = JSON.parse(errorText)
            if (errorData.error?.message) {
              errorMessage = errorData.error.message
            }
          } catch (e) {
            // If parsing fails, use the error text as is
            if (errorText && errorText.length < 100) {
              errorMessage = errorText
            }
          }

          throw new Error(errorMessage)
        }

        const userData = await response.json()

        if (!userData) {
          console.log("No user data found")
          return null
        }

        // Transform the user data to our UserProfile interface
        return this.transformUserToProfile(userData)
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("Request timeout: The server took too long to respond")
        }
        throw error
      }
    } catch (error) {
      console.error("Get profile error:", error)

      // Only show toast in client-side environment and not on auth pages
      if (typeof window !== "undefined" && !window.location.pathname.includes("/auth")) {
        toast({
          title: "Failed to load profile",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        })
      }

      throw error
    }
  },

  // Update user profile
  async updateProfile(token: string, profileData: UpdateProfileInput): Promise<UserProfile | null> {
    try {
      // Validate inputs
      if (!token) {
        console.warn("Missing token in updateProfile")
        throw new Error("Authentication required")
      }

      // First, get the current user to get the ID
      const currentUser = await this.getProfile(token)
      if (!currentUser || !currentUser.id) {
        throw new Error("Could not retrieve user ID for update")
      }

      // Build the correct API URL with the user ID
      const apiUrl = buildApiUrl(`/api/users/${currentUser.id}`)

      // Log the data being sent
      console.log(`Updating profile at ${apiUrl} with data:`, JSON.stringify(profileData, null, 2))

      // Create a timeout for the request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        // Log the request details for debugging
        console.log("Making update request with headers:", {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer [token redacted]",
        })

        // Make the update request with direct JSON payload
        const response = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
          signal: controller.signal,
          cache: "no-store", // Ensure we don't use cached data
        })

        clearTimeout(timeoutId)

        // Log the response status for debugging
        console.log(`Profile update response status: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Could not read error response")
          console.error(`API error response: ${response.status} ${response.statusText}`, errorText)

          let errorMessage = `API error: ${response.status} ${response.statusText}`
          try {
            // Try to parse as JSON to get a more specific error message
            const errorData = JSON.parse(errorText)
            if (errorData.error?.message) {
              errorMessage = errorData.error.message
            }
          } catch (e) {
            // If parsing fails, use the error text as is
            if (errorText && errorText.length < 100) {
              errorMessage = errorText
            }
          }

          // Special handling for 403 Forbidden errors
          if (response.status === 403) {
            errorMessage = "You don't have permission to update this profile. Your session may have expired."
          }

          throw new Error(errorMessage)
        }

        const userData = await response.json()

        // For successful updates, return the transformed profile
        return this.transformUserToProfile(userData)
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("Request timeout: The server took too long to respond")
        }

        // Add more detailed error logging
        console.error("Fetch error details:", error.message || "Unknown error")

        throw error
      }
    } catch (error) {
      console.error("Update profile error:", error)

      // Only show toast in client-side environment
      if (typeof window !== "undefined") {
        toast({
          title: "Profile update failed",
          description:
            error instanceof Error
              ? `${error.message}. Please try again later.`
              : "An unknown error occurred. Please try again later.",
          variant: "destructive",
        })
      }

      throw error // Re-throw to allow the calling code to handle it
    }
  },

  // Helper function to transform User data to our UserProfile interface
  transformUserToProfile(userData: any): UserProfile {
    return {
      id: userData.id,
      username: userData.username || "",
      email: userData.email || "",
      displayName: userData.displayName === undefined ? "" : userData.displayName,
      bio: userData.bio === undefined ? "" : userData.bio,
      location: userData.location === undefined ? "" : userData.location,
      website: userData.website === undefined ? "" : userData.website,
      profileImage: userData.profileImage
        ? { url: userData.profileImage.url || userData.profileImage.formats?.thumbnail?.url || "" }
        : undefined,
      coverImage: userData.coverImage
        ? { url: userData.coverImage.url || userData.coverImage.formats?.medium?.url || "" }
        : undefined,
      isVerified: userData.isVerified || false,
      followersCount: userData.followersCount || 0,
      followingCount: userData.followingCount || 0,
      postsCount: userData.postsCount || 0,
      preferences: userData.preferences || {
        emailNotifications: true,
        pushNotifications: true,
        profileVisibility: "public",
      },
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    }
  },

  // Get default profile data for a new user
  getDefaultProfileData(user: User): UpdateProfileInput {
    return {
      displayName: user.username || "",
      bio: "",
      location: "",
      website: "",
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        profileVisibility: "public",
      },
    }
  },
}
