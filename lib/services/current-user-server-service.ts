"use server"

import { verifySession } from "@/lib/auth/session"
import qs from "qs"

/**
 * Server-side current user profile service - optimized like profile/[documentId]
 * Fetches current user data with posts, followers, following in a single request
 */

interface CurrentUserProfile {
  id: number
  documentId: string
  username: string
  displayName?: string
  email?: string
  bio?: string
  location?: string
  website?: string
  profileImage?: {
    url: string
    alternativeText?: string
  }
  coverImage?: {
    url: string
    alternativeText?: string
  }
  followersCount: number
  followingCount: number
  postsCount: number
  isVerified?: boolean
  confirmed?: boolean
  posts?: any[]
  createdAt: string
  updatedAt: string
}

interface CurrentUserProfileResponse {
  user: CurrentUserProfile
  isOwnProfile: boolean
  isAuthenticated: boolean
}

interface ErrorResponse {
  error: true
  message: string
  requiresAuth?: boolean
}

/**
 * Fetch current user profile using optimized server-side approach
 */
export async function fetchCurrentUserProfileOptimized(): Promise<CurrentUserProfileResponse | ErrorResponse> {
  try {
    console.log(`[CurrentUserServer] Fetching current user profile`)

    // Get authentication from secure session
    const session = await verifySession()
    const userJwt = session?.strapiJWT

    if (!session || !userJwt) {
      console.log(`[CurrentUserServer] No valid session found`)
      return { error: true, message: "Authentication required", requiresAuth: true }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:1337"

    // First fetch user data (without posts for better performance)
    const userUrl = `${apiUrl}/api/users/me?populate[profileImage]=*&populate[coverImage]=*`

    console.log(`[CurrentUserServer] Fetching user data from: ${userUrl}`)

    const userResponse = await fetch(userUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      cache: "no-store",
      next: {
        revalidate: 0,
      },
    })

    if (!userResponse.ok) {
      console.error(`[CurrentUserServer] User API request failed: ${userResponse.status} ${userResponse.statusText}`)

      if (userResponse.status === 401 || userResponse.status === 403) {
        return { error: true, message: "Authentication required", requiresAuth: true }
      }

      return {
        error: true,
        message: `Failed to fetch profile: ${userResponse.status}`,
      }
    }

    const userData = await userResponse.json()

    if (!userData || !userData.username) {
      console.log(`[CurrentUserServer] Invalid user data returned`)
      return { error: true, message: "Invalid user data" }
    }

    // Now fetch posts using the optimized /api/posts endpoint
    const postsUrl = `${apiUrl}/api/posts?filters[user][id][$eq]=${userData.id}&fields[0]=id&fields[1]=documentId&fields[2]=title&fields[3]=description&fields[4]=contentType&fields[5]=background&fields[6]=galleryLayout&fields[7]=likesCount&fields[8]=commentsCount&fields[9]=savesCount&fields[10]=createdAt&fields[11]=updatedAt&populate[media][fields][0]=id&populate[media][fields][1]=url&populate[media][fields][2]=formats&populate[media][fields][3]=mime&populate[media][fields][4]=width&populate[media][fields][5]=height&populate[media][fields][6]=name&sort[0]=createdAt:desc&pagination[page]=1&pagination[pageSize]=10`

    console.log(`[CurrentUserServer] Fetching posts from: ${postsUrl}`)

    const postsResponse = await fetch(postsUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      cache: "no-store",
      next: {
        revalidate: 0,
      },
    })

    let posts = []
    if (postsResponse.ok) {
      const postsData = await postsResponse.json()
      posts = postsData.data || []
      console.log(`[CurrentUserServer] Fetched ${posts.length} posts for user`)
    } else {
      console.warn(`[CurrentUserServer] Posts fetch failed: ${postsResponse.status}`)
    }

    console.log(`[CurrentUserServer] User data:`, {
      id: userData?.id,
      documentId: userData?.documentId,
      username: userData?.username,
      postsCount: userData?.postsCount,
      followersCount: userData?.followersCount,
      followingCount: userData?.followingCount,
      fetchedPosts: posts.length
    })

    // Transform the data to match frontend expectations
    const transformedUser: CurrentUserProfile = {
      id: userData.id,
      documentId: userData.documentId,
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email,
      bio: userData.bio,
      location: userData.location,
      website: userData.website,
      profileImage: userData.profileImage,
      coverImage: userData.coverImage,
      followersCount: userData.followersCount || 0, // Backend calculated
      followingCount: userData.followingCount || 0, // Backend calculated
      postsCount: userData.postsCount || 0, // Backend calculated
      isVerified: userData.isVerified || false,
      confirmed: userData.confirmed || false,
      posts: posts, // Use posts from /api/posts endpoint
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    }

    const result: CurrentUserProfileResponse = {
      user: transformedUser,
      isOwnProfile: true, // Always true for current user
      isAuthenticated: true,
    }

    console.log(`[CurrentUserServer] Returning profile data:`, {
      username: result.user.username,
      isOwnProfile: result.isOwnProfile,
      isAuthenticated: result.isAuthenticated,
      followersCount: result.user.followersCount,
      followingCount: result.user.followingCount,
      postsCount: result.user.postsCount,
    })

    return result

  } catch (error) {
    console.error("[CurrentUserServer] Error fetching profile:", error)
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}