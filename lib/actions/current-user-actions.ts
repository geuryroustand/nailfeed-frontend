"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import qs from "qs"
import type { UserProfileResponse } from "@/lib/services/user-service"

/**
 * Fetches the current user's profile with optimized data loading
 * @returns The current user's profile data
 */
export async function fetchCurrentUserProfileOptimized() {
  try {
    console.log("[Server Action] Fetching current user profile data")

    // Get authentication token from cookies
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      console.error("[Server Action] No authentication token available")
      return { error: true, message: "Authentication required", requiresAuth: true }
    }

    // Construct the API URL with all required data in a single request
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Use qs to construct the query parameters for optimized data fetching
    const query = qs.stringify(
      {
        populate: {
          profileImage: true,
          coverImage: true,
          posts: {
            sort: ["publishedAt:desc"],
            populate: {
              mediaItems: {
                populate: ["file"],
              },
            },
          },
          followers: {
            populate: ["follower.profileImage"],
          },
          following: {
            populate: ["following.profileImage"],
          },
        },
      },
      {
        encodeValuesOnly: true,
      },
    )

    const url = `${apiUrl}/api/users/me?${query}`

    console.log(`[Server Action] Fetching from endpoint: ${url}`)

    // Make the API request with proper error handling
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      next: {
        revalidate: 0,
        tags: ["current-user-profile"],
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Failed to get error text")
      console.error(`[Server Action] Failed to fetch current user data: ${response.status} - ${errorText}`)

      // Check if the error is due to authentication issues
      if (response.status === 401 || response.status === 403) {
        return { error: true, message: "Authentication required", requiresAuth: true }
      }

      return { error: true, message: `API error: ${response.status}` }
    }

    // Parse the response data with error handling
    let userData
    try {
      userData = await response.json()
    } catch (parseError) {
      console.error("[Server Action] Failed to parse API response:", parseError)
      return { error: true, message: "Invalid API response format" }
    }

    // Extract the user data from the response
    const user = userData.data?.attributes || userData

    // Ensure user has required fields
    if (!user || !user.username) {
      console.error("[Server Action] Invalid user data structure:", user)
      return { error: true, message: "Invalid user data structure" }
    }

    // Process followers and following data
    const followers = processFollowers(user.followers || [])
    const following = processFollowing(user.following || [])

    // Process posts data
    const posts = processPosts(user.posts || [])

    // Transform the data to match the expected format
    const transformedUser: UserProfileResponse = {
      id: user.id || userData.id,
      documentId: user.documentId || "",
      username: user.username,
      displayName: user.displayName || user.username,
      bio: user.bio || "",
      website: user.website || "",
      location: user.location || "",
      isVerified: user.isVerified || false,
      confirmed: user.confirmed || false,
      stats: {
        followers: user.followersCount || followers.length || 0,
        following: user.followingCount || following.length || 0,
        posts: user.postsCount || posts.length || 0,
      },
      profileImage: user.profileImage,
      coverImage: user.coverImage,
      followers: followers,
      following: following,
      posts: posts,
      engagement: user.engagement || {
        likes: 0,
        comments: 0,
        saves: 0,
      },
      followersCount: user.followersCount || followers.length || 0,
      followingCount: user.followingCount || following.length || 0,
      postsCount: user.postsCount || posts.length || 0,
    }

    console.log(`[Server Action] Successfully fetched current user profile data for ${user.username}`)

    return {
      user: transformedUser,
      isAuthenticated: true,
      isOwnProfile: true,
    }
  } catch (error) {
    console.error("[Server Action] Error fetching current user profile data:", error)
    return { error: true, message: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Updates the current user's profile
 * @param profileData The profile data to update
 * @returns The result of the update operation
 */
export async function updateCurrentUserProfile(profileData: any) {
  try {
    console.log("[Server Action] Updating current user profile")

    // Get authentication token from cookies
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      console.error("[Server Action] No authentication token available")
      return { success: false, error: "Authentication required" }
    }

    // Validate input data
    if (profileData.displayName && profileData.displayName.length > 50) {
      return {
        success: false,
        error: "Display name must be less than 50 characters",
      }
    }

    if (profileData.bio && profileData.bio.length > 500) {
      return {
        success: false,
        error: "Bio must be less than 500 characters",
      }
    }

    // Construct the API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // First, get the current user to get their ID
    const currentUserResponse = await fetch(`${apiUrl}/api/users/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!currentUserResponse.ok) {
      return {
        success: false,
        error: "Failed to get current user information",
      }
    }

    const currentUserData = await currentUserResponse.json()
    const userId = currentUserData.id

    console.log(`[Server Action] Updating profile for user ID: ${userId}`)

    // Update the profile
    const updateResponse = await fetch(`${apiUrl}/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text().catch(() => "Failed to get error text")
      console.error(`[Server Action] Failed to update profile: ${updateResponse.status} - ${errorText}`)
      return {
        success: false,
        error: `Failed to update profile: ${updateResponse.statusText}`,
      }
    }

    // Revalidate paths
    revalidatePath("/profile", "layout")
    revalidatePath("/", "layout")

    return {
      success: true,
      data: await updateResponse.json(),
    }
  } catch (error) {
    console.error("[Server Action] Error updating current user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Process followers data from API response
 */
function processFollowers(followers: any[]): any[] {
  if (!Array.isArray(followers)) return []

  return followers
    .map((item) => {
      // Extract follower data based on the API response structure
      const followerData = item.follower || {}

      return {
        id: followerData.id || item.id,
        username: followerData.username || "",
        displayName: followerData.displayName || followerData.username || "",
        profileImage: followerData.profileImage || null,
      }
    })
    .filter((follower) => follower.username) // Filter out invalid followers
}

/**
 * Process following data from API response
 */
function processFollowing(following: any[]): any[] {
  if (!Array.isArray(following)) return []

  return following
    .map((item) => {
      // Extract following data based on the API response structure
      const followingData = item.following || {}

      return {
        id: followingData.id || item.id,
        username: followingData.username || "",
        displayName: followingData.displayName || followingData.username || "",
        profileImage: followingData.profileImage || null,
      }
    })
    .filter((follow) => follow.username) // Filter out invalid following
}

/**
 * Process posts data from API response
 */
function processPosts(posts: any[]): any[] {
  if (!Array.isArray(posts)) return []

  return posts.map((post) => {
    // Process media items for this post
    const mediaItems = processMediaItems(post.mediaItems)

    return {
      id: post.id,
      documentId: post.documentId || post.id.toString(),
      title: post.title || "",
      description: post.description || "",
      contentType: post.contentType || "media-gallery",
      galleryLayout: post.galleryLayout || "grid",
      publishedAt: post.publishedAt || post.createdAt,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      savesCount: post.savesCount || 0,
      mediaItems: mediaItems,
    }
  })
}

/**
 * Process media items from API response
 */
function processMediaItems(mediaItems: any): any[] {
  if (!mediaItems) return []

  // Handle different API response structures for media items
  const items = Array.isArray(mediaItems)
    ? mediaItems
    : mediaItems.data && Array.isArray(mediaItems.data)
      ? mediaItems.data
      : []

  return items.map((item) => {
    // Extract media item data
    const mediaItemData = item.attributes || item

    // Extract file data
    const fileData = extractFileData(mediaItemData.file)

    return {
      id: mediaItemData.id || item.id,
      type: mediaItemData.type || "image",
      order: mediaItemData.order || 0,
      file: fileData,
    }
  })
}

/**
 * Extract file data from API response
 */
function extractFileData(file: any): any {
  if (!file) return {}

  // Handle different API response structures for files
  if (file.data && file.data.attributes) {
    return file.data.attributes
  }

  return file
}
