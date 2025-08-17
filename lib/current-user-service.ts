import { cookies } from "next/headers"
import qs from "qs"
import type { UserProfileResponse } from "@/lib/services/user-service"

/**
 * Fetches the current user's profile data using the /api/users/me endpoint
 * @returns The current user's profile data or an error/not found indicator
 */
export async function fetchCurrentUserProfile() {
  try {
    console.log("Fetching current user profile data")

    // Get authentication token from cookies
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      console.error("No authentication token available")
      return { error: true, message: "Authentication required", requiresAuth: true }
    }

    // Construct the API URL with all required data in a single request
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Use qs to construct the query parameters
    const query = qs.stringify(
      {
        populate: {
          profileImage: true,
          coverImage: true,
          posts: {
            filters: {
              publishedAt: {
                $notNull: true,
              },
            },
            populate: {
              mediaItems: {
                populate: {
                  file: true,
                },
              },
            },
          },
          followers: {
            populate: {
              follower: {
                populate: {
                  profileImage: true,
                  coverImage: true,
                },
              },
            },
          },
          following: {
            populate: {
              following: {
                populate: {
                  profileImage: true,
                  coverImage: true,
                },
              },
            },
          },
        },
      },
      {
        encodeValuesOnly: true,
      },
    )

    const url = `${apiUrl}/api/users/me?${query}`

    console.log(`Fetching from endpoint: ${url}`)

    // Make the API request with proper error handling
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Failed to get error text")
      console.error(`Failed to fetch current user data: ${response.status} - ${errorText}`)

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
      console.error("Failed to parse API response:", parseError)
      return { error: true, message: "Invalid API response format" }
    }

    // Log the raw response for debugging
    console.log("Raw API response structure:", JSON.stringify(userData).substring(0, 200) + "...")

    // Extract the user data from the response
    const user = userData.data?.attributes || userData

    // Ensure user has required fields
    if (!user || !user.username) {
      console.error("Invalid user data structure:", user)
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
    }

    console.log(`Successfully fetched current user profile data for ${user.username}`)
    console.log(
      `Profile stats: ${transformedUser.stats.posts} posts, ${transformedUser.stats.followers} followers, ${transformedUser.stats.following} following`,
    )

    return {
      user: transformedUser,
      isAuthenticated: true,
      isOwnProfile: true,
    }
  } catch (error) {
    console.error("Error fetching current user profile data:", error)
    return { error: true, message: error instanceof Error ? error.message : "Unknown error" }
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

/**
 * Type definitions for the return value of fetchCurrentUserProfile
 */
export type CurrentUserProfileData =
  | {
      user: UserProfileResponse
      isAuthenticated: boolean
      isOwnProfile: boolean
    }
  | {
      error: boolean
      message?: string
      requiresAuth?: boolean
    }
