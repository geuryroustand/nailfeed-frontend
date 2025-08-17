// Server-side data fetching for user profile data
import { UserService } from "@/lib/services/user-service"
import { cookies } from "next/headers"
import config from "@/lib/config"
import { PostService } from "@/lib/services/post-service" // Direct import of PostService

export type UserProfile = {
  username: string
  displayName: string
  bio: string
  website: string
  location: string
  avatar: string
  isVerified: boolean
  isFollowing: boolean
  stats: {
    posts: number
    followers: number
    following: number
  }
  engagement: {
    likes: number
    comments: number
    saves: number
  }
  profileImage?: {
    url: string
  }
  posts?: Array<any> // Include posts in the UserProfile type
}

export async function getUserProfile(username?: string): Promise<UserProfile | null> {
  try {
    console.log(`Fetching user profile for: ${username || "current user"}`)

    // Get token from cookies or config
    const cookieToken = cookies().get("jwt")?.value || cookies().get("authToken")?.value
    const configToken = config.api.getApiToken()
    const token = cookieToken || configToken

    console.log(`Using API token: ${token ? `${token.substring(0, 5)}...` : "No token"}`)

    // If no token is available, use a public access approach for username lookups
    if (!token && username) {
      console.log(`No authentication token found, using public access for username: ${username}`)
      return getUserProfilePublic(username)
    } else if (!token) {
      console.log("No authentication token found and no username provided")
      return null
    }

    // If no username is provided, get the current user
    if (!username) {
      // Use /api/users/me for the current user's profile
      const currentUser = await UserService.getCurrentUser(token)
      if (!currentUser) {
        console.error("Failed to fetch current user")
        return null
      }

      // For current user, we need to fetch their posts separately
      // since getCurrentUser() doesn't include posts
      let userPosts = []
      try {
        // Fetch posts for the current user
        userPosts = await PostService.getPostsByUsername(currentUser.username, token)

        if (userPosts && userPosts.length > 0) {
          console.log(`Successfully fetched ${userPosts.length} posts for current user ${currentUser.username}`)
        } else {
          console.log(`No posts found for current user ${currentUser.username}`)
        }
      } catch (error) {
        console.error(`Error fetching posts for current user ${currentUser.username}:`, error)
      }

      // Transform the user data to our UserProfile interface
      return {
        username: currentUser.username,
        displayName: currentUser.displayName || currentUser.username,
        bio: currentUser.bio || "",
        website: currentUser.website || "",
        location: currentUser.location || "",
        avatar: currentUser.profileImage?.url || "",
        isVerified: currentUser.isVerified || false,
        isFollowing: false, // Current user doesn't follow themselves
        stats: {
          posts: currentUser.postsCount || userPosts.length || 0,
          followers: currentUser.followersCount || 0,
          following: currentUser.followingCount || 0,
        },
        engagement: currentUser.engagement || {
          likes: 0,
          comments: 0,
          saves: 0,
        },
        profileImage: currentUser.profileImage
          ? {
              url: currentUser.profileImage.url,
            }
          : undefined,
        posts: userPosts || [], // Include the separately fetched posts
      }
    }

    // For other usernames, use /api/users with username filter
    // Get user by username
    console.log(`Fetching user data for username: ${username}`)
    const userData = await UserService.getUserByUsername(username, token)
    if (!userData) {
      console.error(`User ${username} not found`)
      return null
    }

    // Check if posts are included in the user data
    if (!userData.posts || userData.posts.length === 0) {
      console.log(`No posts found in user data for ${username}, fetching posts separately`)

      try {
        // Fetch posts for the user
        const posts = await PostService.getPostsByUsername(username, token)

        if (posts && posts.length > 0) {
          console.log(`Successfully fetched ${posts.length} posts for ${username}`)
          // Add posts to userData
          userData.posts = posts
        } else {
          console.log(`No posts found for ${username}`)
        }
      } catch (error) {
        console.error(`Error fetching posts for ${username}:`, error)
      }
    }

    // Get user engagement data - handle errors gracefully
    let engagementData = { likes: 0, comments: 0, saves: 0 }
    try {
      const fetchedEngagement = await UserService.getUserEngagement(username, token)
      if (fetchedEngagement) {
        engagementData = fetchedEngagement
      }
    } catch (error) {
      console.log(`Could not fetch engagement data for ${username}, using defaults:`, error)
      // Continue with default engagement data
    }

    // Transform the user data to our UserProfile interface
    const user = {
      username: userData.username,
      displayName: userData.displayName || userData.username,
      bio: userData.bio || "",
      website: userData.website || "",
      location: userData.location || "",
      avatar: userData.profileImage?.url || "",
      isVerified: userData.isVerified || false,
      isFollowing: false, // We would need to check this from the API
      stats: {
        posts: userData.postsCount || 0,
        followers: userData.followersCount || 0,
        following: userData.followingCount || 0,
      },
      engagement: engagementData,
      profileImage: userData.profileImage
        ? {
            url: userData.profileImage.url,
          }
        : undefined,
      posts: userData.posts || [], // Include posts
    }

    // Log the complete user data structure
    console.log(
      "PROCESSED USER DATA:",
      JSON.stringify(
        {
          username: user.username,
          displayName: user.displayName,
          postsCount: user.posts?.length || 0,
        },
        null,
        2,
      ),
    )

    return user
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}

// Function to get public user profile data without authentication
async function getUserProfilePublic(username: string): Promise<UserProfile | null> {
  try {
    console.log(`Fetching public profile for username: ${username}`)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Use the API token from config for public access
    const token = config.api.getApiToken()

    if (!token) {
      console.error("No API token available for public profile access")
      return null
    }

    // Use the optimized endpoint for public access
    const url = `${apiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(username)}&populate[0]=profileImage&populate[1]=coverImage&populate[2]=posts&populate[3]=followers.follower.profileImage&populate[4]=followers.follower.coverImage&populate[5]=followers.following.profileImage&populate[6]=followers.following.coverImage&populate[7]=following.follower.profileImage&populate[8]=following.follower.coverImage&populate[9]=following.following.profileImage&populate[10]=following.following.coverImage`

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Failed to fetch public profile: ${response.status}`)
      return null
    }

    const data = await response.json()
    const userData = data.data?.[0] || data[0]

    if (!userData) {
      console.error(`No public data found for username: ${username}`)
      return null
    }

    // Extract the actual user data from the response
    const user = userData.attributes || userData

    // Process followers and following data
    const followers = user.followers?.data?.map((item) => item.attributes || item) || []
    const following = user.following?.data?.map((item) => item.attributes || item) || []

    // Return a profile with all the necessary data
    return {
      username: user.username,
      displayName: user.displayName || user.username,
      bio: user.bio || "",
      website: user.website || "",
      location: user.location || "",
      avatar: user.profileImage?.data?.attributes?.url || user.profileImage?.url || "",
      isVerified: user.isVerified || false,
      isFollowing: false,
      stats: {
        posts: user.postsCount || user.posts?.data?.length || 0,
        followers: user.followersCount || followers.length || 0,
        following: user.followingCount || following.length || 0,
      },
      engagement: {
        likes: 0,
        comments: 0,
        saves: 0,
      },
      profileImage: user.profileImage?.data?.attributes || user.profileImage,
      coverImage: user.coverImage?.data?.attributes || user.coverImage,
      followers: followers,
      following: following,
      posts: user.posts?.data?.map((post) => post.attributes || post) || [],
    }
  } catch (error) {
    console.error(`Error fetching public profile for ${username}:`, error)
    return null
  }
}

/**
 * Get user data by document ID
 */
export async function getUserByDocumentId(documentId: string) {
  try {
    console.log(`Fetching user with document ID: ${documentId}`)

    // Get API token from config or cookies
    const cookieToken = cookies().get("jwt")?.value || cookies().get("authToken")?.value
    const configToken = config.api.getApiToken()
    const token = cookieToken || configToken

    if (!token) {
      console.error("No API token available for fetching user data")
      return null
    }

    // Use the UserService directly instead of building our own query
    const user = await UserService.getUserByDocumentId(documentId, token)

    if (!user) {
      console.error(`No user found with document ID: ${documentId}`)
      return null
    }

    // Log detailed information about the posts
    console.log("User data fetched successfully:", {
      id: user.id,
      username: user.username,
      postsCount: user.postsCount,
      actualPostsLength: user.posts?.length || 0,
      postIds: user.posts?.map((p) => p.id) || [],
    })

    return user
  } catch (error) {
    console.error(`Error fetching user with document ID ${documentId}:`, error)
    return null
  }
}

/**
 * Get user data by username
 */
export async function getUserByUsername(username: string) {
  try {
    console.log(`Fetching user with username: ${username}`)

    // Get API token from config or cookies
    const cookieToken = cookies().get("jwt")?.value || cookies().get("authToken")?.value
    const configToken = config.api.getApiToken()
    const token = cookieToken || configToken

    if (!token) {
      console.error("No API token available for fetching user data")
      return null
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Use the optimized endpoint that fetches all required data in a single request
    const url = `${apiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(username)}&populate[0]=profileImage&populate[1]=coverImage&populate[2]=posts&populate[3]=followers.follower.profileImage&populate[4]=followers.follower.coverImage&populate[5]=followers.following.profileImage&populate[6]=followers.following.coverImage&populate[7]=following.follower.profileImage&populate[8]=following.follower.coverImage&populate[9]=following.following.profileImage&populate[10]=following.following.coverImage`

    console.log(`Fetching from optimized endpoint: ${url}`)

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Failed to fetch user data: ${response.status}`)
      return null
    }

    const data = await response.json()
    const userData = data.data?.[0] || data[0]

    if (!userData) {
      console.error(`No user found with username: ${username}`)
      return null
    }

    console.log(`Successfully fetched user data for ${username} with optimized endpoint`)

    // Return the complete user data with all nested information
    return userData.attributes || userData
  } catch (error) {
    console.error(`Error fetching user with username ${username}:`, error)
    return null
  }
}

export interface FollowActionResult {
  success: boolean
  isFollowing: boolean
  newFollowerCount?: number
  newFollowingCount?: number
  message?: string
}

export interface ProfileUpdateResult {
  success: boolean
  message: string
  user?: {
    displayName: string
    bio: string
    website: string
    location: string
  }
}

export type RecommendedUser = {
  id: number
  username: string
  image: string
  bio: string
  profileImage?: {
    url: string
  }
}

export async function getFeaturedUsers(): Promise<RecommendedUser[]> {
  try {
    // Get token from cookies or config
    const cookieToken = cookies().get("jwt")?.value || cookies().get("authToken")?.value
    const configToken = config.api.getApiToken()
    const token = cookieToken || configToken

    if (!token) {
      console.error("No authentication token found for featured users")
      return []
    }

    // In a real implementation, you would fetch featured users from the API
    // For now, return an empty array
    return []
  } catch (error) {
    console.error("Error in getFeaturedUsers:", error)
    return []
  }
}
