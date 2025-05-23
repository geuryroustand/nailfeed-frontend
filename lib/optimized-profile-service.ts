import { cookies } from "next/headers"
import config from "@/lib/config"
import type { UserProfileResponse } from "@/lib/services/user-service"
import qs from "qs"

/**
 * Fetches user profile data using a single optimized API call
 * @param username The username to fetch profile data for
 * @returns The profile data or an error/not found indicator
 */
export async function fetchUserProfile(username: string) {
  try {
    console.log(`Fetching optimized profile data for username: ${username}`)

    // Get authentication token from cookies or config
    const cookieToken = cookies().get("jwt")?.value || cookies().get("authToken")?.value
    const configToken = config.api.getApiToken()
    const token = cookieToken || configToken
    const isAuthenticated = !!cookieToken

    if (!token) {
      console.error("No API token available for fetching profile data")
      return { error: true, message: "No API token available" }
    }

    // Construct the optimized API URL with all required data in a single request
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Use qs to construct the query parameters
    const query = qs.stringify(
      {
        filters: {
          username: {
            $eq: username,
          },
        },
        populate: {
          profileImage: true,
          coverImage: true,
          posts: {
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
              following: {
                populate: {
                  profileImage: true,
                  coverImage: true,
                },
              },
            },
          },
          following: {
            populate: {
              follower: {
                populate: {
                  profileImage: true,
                  coverImage: true,
                },
              },
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
        encodeValuesOnly: true, // Don't encode the keys, only the values
      },
    )

    const url = `${apiUrl}/api/users?${query}`

    console.log(`Fetching from optimized endpoint: ${url}`)

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
      console.error(`Failed to fetch profile data: ${response.status} - ${errorText}`)
      return { error: true, message: `API error: ${response.status}` }
    }

    // Parse the response data with error handling
    let responseData
    try {
      responseData = await response.json()
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError)
      return { error: true, message: "Invalid API response format" }
    }

    // Handle both array response and object with data property
    const usersArray = Array.isArray(responseData)
      ? responseData
      : responseData.data && Array.isArray(responseData.data)
        ? responseData.data
        : null

    if (!usersArray || usersArray.length === 0) {
      console.error(`No user found with username: ${username}`)
      return { notFound: true }
    }

    // Get the first user from the array
    const userData = usersArray[0]

    if (!userData || !userData.username) {
      console.error(`Invalid user data for username: ${username}`)
      return { notFound: true }
    }

    // Process the user data
    const user = userData

    // Process followers and following data
    const followers = processFollowers(user.followers || [])
    const following = processFollowing(user.following || [])

    // Process posts data with media items
    const posts = processPosts(user.posts || [])

    // Transform the data to match the expected format
    const transformedUser: UserProfileResponse = {
      id: user.id,
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

    console.log(`Successfully fetched optimized profile data for ${username}`)
    console.log(
      `Profile stats: ${transformedUser.stats.posts} posts, ${transformedUser.stats.followers} followers, ${transformedUser.stats.following} following`,
    )
    console.log(
      `Posts with media items: ${posts.filter((post) => post.mediaItems && post.mediaItems.length > 0).length}`,
    )

    // Check if this is the current user's profile
    const isOwnProfile = false // Default to false for public profiles

    return {
      user: transformedUser,
      isAuthenticated,
      isOwnProfile,
    }
  } catch (error) {
    console.error(`Error fetching optimized profile data for ${username}:`, error)
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
 * Process posts data from API response, ensuring media items are included
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
 * Type definitions for the return value of fetchUserProfile
 */
export type ProfileData =
  | {
      user: UserProfileResponse
      isAuthenticated: boolean
      isOwnProfile: boolean
    }
  | {
      notFound: boolean
      message?: string
    }
  | {
      error: boolean
      message?: string
    }
