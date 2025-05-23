import { getUserProfile } from "@/lib/user-data"
import { cookies } from "next/headers"
import type { UserProfileResponse } from "@/types/user"

/**
 * Shared logic for fetching profile data and determining if it's the current user's profile
 */
export async function getProfileData(username: string) {
  try {
    // Check if we have an auth token
    const hasToken = cookies().has("jwt") || cookies().has("authToken")
    const isAuthenticated = !!hasToken

    console.log(`Getting profile data for ${username} (authenticated: ${isAuthenticated})`)

    // Get the user profile data with optimized image fetching
    const user = await getUserProfile(username)

    if (!user) {
      console.error(`No user found for username: ${username}`)
      return { notFound: true }
    }

    // Check if this is the user's own profile
    const isOwnProfile = false // We can't determine this without the current user's data

    // Log the profile data for debugging
    console.log(`Profile data for ${username}:`, {
      hasProfileImage: !!user.profileImage?.url,
      hasCoverImage: !!user.coverImage?.url,
      followersCount: user.stats.followers,
      followingCount: user.stats.following,
      postsCount: user.stats.posts,
    })

    return {
      user,
      isOwnProfile,
      isAuthenticated,
    }
  } catch (error) {
    console.error(`Error in getProfileData for ${username}:`, error)
    return { error: true }
  }
}

/**
 * Type for the profile data returned by getProfileData
 */
export type ProfilePageData =
  | {
      user: UserProfileResponse
      isOwnProfile: boolean
      isAuthenticated: boolean
    }
  | {
      notFound: boolean
    }
  | {
      error: boolean
    }
