"use server"

import qs from "qs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export type FollowUser = {
  id: number | string
  documentId: string
  username: string
  displayName: string
  profileImage?: {
    url: string
  }
  isFollowing?: boolean
}

export type FollowListResponse = {
  users: FollowUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isAuthenticated: boolean
}

// Helper function to get API URL
function getApiUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

// Helper function to get auth token - DIRECTLY use environment variables
function getApiToken(): string | null {
  // Directly use API_TOKEN or NEXT_PUBLIC_API_TOKEN
  return process.env.API_TOKEN || process.env.NEXT_PUBLIC_API_TOKEN || null
}

// Helper function for API requests with proper error handling
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    console.log(`API Request: ${url}`)

    // Get the API token
    const token = getApiToken()

    if (!token) {
      console.error("No API token available")
      throw new Error("No API token available")
    }

    // Create headers with the token
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }

    const response = await fetch(url, {
      ...options,
      headers,
      next: { revalidate: 0 }, // Ensure fresh data
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error (${response.status}): ${errorText}`)
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API Request failed:", error)
    throw error
  }
}

// Get user documentId by username using public API
async function getUserDocumentIdByUsername(username: string): Promise<string | null> {
  try {
    const apiUrl = getApiUrl()

    const query = qs.stringify({
      filters: {
        username: {
          $eq: username,
        },
      },
    })

    const userResponse = await apiRequest<any>(`${apiUrl}/api/users?${query}`, {})

    // Handle different response formats
    const userData = userResponse.data || userResponse
    if (!userData || !userData.length) {
      console.error(`User not found: ${username}`)
      return null
    }

    return userData[0].documentId || null
  } catch (error) {
    console.error(`Error fetching user documentId for ${username}:`, error)
    return null
  }
}

// Get followers for a user
export async function getFollowers(username: string, page = 1, pageSize = 10): Promise<FollowListResponse> {
  try {
    const apiUrl = getApiUrl()
    const token = getApiToken()

    // Check if user is authenticated (for follow button state)
    const cookieStore = cookies()
    const userToken = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value
    const isAuthenticated = !!userToken

    if (!token) {
      console.error("No API token found for fetching followers")
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      }
    }

    // Get user documentId
    const userDocumentId = await getUserDocumentIdByUsername(username)
    if (!userDocumentId) {
      console.error(`User documentId not found for ${username}`)
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      }
    }

    // Fetch followers using the correct query format
    const followersQuery = qs.stringify({
      filters: {
        following: {
          documentId: {
            $eq: userDocumentId,
          },
        },
      },
      populate: "*",
      pagination: {
        page,
        pageSize,
      },
      sort: ["createdAt:desc"],
    })

    // Log the query for debugging
    console.log(`Followers query: ${followersQuery}`)

    // Make the request with auth token
    const followsResponse = await apiRequest<any>(`${apiUrl}/api/follows?${followersQuery}`, {})

    // Log the response for debugging
    console.log(`Followers response:`, JSON.stringify(followsResponse, null, 2))

    // Get current user's following list if authenticated
    const followingDocumentIds = new Set<string>()
    if (isAuthenticated) {
      try {
        const meResponse = await fetch(`${apiUrl}/api/users/me?populate=following`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }).then((res) => {
          if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`)
          return res.json()
        })

        // Extract documentIds of users the current user is following
        if (meResponse.following) {
          meResponse.following.forEach((follow: any) => {
            const followingDocumentId = follow.following?.documentId
            if (followingDocumentId) followingDocumentIds.add(followingDocumentId)
          })
        }
      } catch (error) {
        console.error("Error fetching current user following:", error)
      }
    }

    // Process followers data based on the actual response structure
    const users = (followsResponse.data || [])
      .map((follow: any) => {
        // Log each follow object for debugging
        console.log(`Processing follow:`, JSON.stringify(follow, null, 2))

        // For followers, we need to check if we have a valid follow relationship
        // The API is returning records where the "following" field is the user we're looking for
        // We need to extract the follower data from somewhere else

        // First, check if we have a follower field
        if (follow.follower) {
          const follower = follow.follower

          // Extract user data
          const followerId = follower.id
          const followerDocumentId = follower.documentId
          const followerUsername = follower.username
          const followerDisplayName = follower.displayName || followerUsername

          // Handle profile image URL
          let profileImageUrl = "/abstract-user-icon.png"
          if (follower.profileImage) {
            profileImageUrl = follower.profileImage.url.startsWith("http")
              ? follower.profileImage.url
              : `${apiUrl}${follower.profileImage.url}`
          }

          return {
            id: followerId,
            documentId: followerDocumentId,
            username: followerUsername,
            displayName: followerDisplayName,
            profileImage: { url: profileImageUrl },
            isFollowing: followingDocumentIds.has(followerDocumentId),
          }
        }
        // If follower is null, we need to try to get the data from the follow object itself
        else if (follow.id) {
          // We need to make an additional API call to get the follower data
          console.log(`Follower is null, trying to get data from follow ID: ${follow.id}`)

          // For now, create a placeholder user from the follow object
          return {
            id: follow.id,
            documentId: follow.documentId,
            username: `follower_${follow.id}`,
            displayName: `Follower ${follow.id}`,
            profileImage: { url: "/abstract-user-icon.png" },
            isFollowing: false,
          }
        }

        console.log(`No valid follower data found in follow object`)
        return null
      })
      .filter(Boolean) as FollowUser[]

    console.log(`Processed ${users.length} followers`)

    return {
      users,
      total: followsResponse.meta?.pagination?.total || users.length,
      page: followsResponse.meta?.pagination?.page || page,
      pageSize: followsResponse.meta?.pagination?.pageSize || pageSize,
      totalPages: followsResponse.meta?.pagination?.pageCount || Math.ceil(users.length / pageSize),
      isAuthenticated,
    }
  } catch (error) {
    console.error("Error in getFollowers:", error)
    return {
      users: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      isAuthenticated: false,
    }
  }
}

// Get users that a user is following
export async function getFollowing(username: string, page = 1, pageSize = 10): Promise<FollowListResponse> {
  try {
    const apiUrl = getApiUrl()
    const token = getApiToken()

    // Check if user is authenticated (for follow button state)
    const cookieStore = cookies()
    const userToken = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value
    const isAuthenticated = !!userToken

    if (!token) {
      console.error("No API token found for fetching following")
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      }
    }

    // Get user documentId
    const userDocumentId = await getUserDocumentIdByUsername(username)
    if (!userDocumentId) {
      console.error(`User documentId not found for ${username}`)
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      }
    }

    // Fetch following using the correct query format
    const followingQuery = qs.stringify({
      filters: {
        follower: {
          documentId: {
            $eq: userDocumentId,
          },
        },
      },
      populate: "*",
      pagination: {
        page,
        pageSize,
      },
      sort: ["createdAt:desc"],
    })

    // Log the query for debugging
    console.log(`Following query: ${followingQuery}`)

    // Make the request with auth token
    const followsResponse = await apiRequest<any>(`${apiUrl}/api/follows?${followingQuery}`, {})

    // Log the response for debugging
    console.log(`Following response:`, JSON.stringify(followsResponse, null, 2))

    // Process following data based on the actual response structure
    const users = (followsResponse.data || [])
      .map((follow: any) => {
        // Log each follow object for debugging
        console.log(`Processing follow:`, JSON.stringify(follow, null, 2))

        const following = follow.following
        if (!following) {
          console.log(`No following data found in follow object`)
          return null
        }

        // Extract user data
        const followingId = following.id
        const followingDocumentId = following.documentId
        const followingUsername = following.username
        const followingDisplayName = following.displayName || followingUsername

        // Handle profile image URL
        let profileImageUrl = "/abstract-user-icon.png"
        if (following.profileImage) {
          profileImageUrl = following.profileImage.url.startsWith("http")
            ? following.profileImage.url
            : `${apiUrl}${following.profileImage.url}`
        }

        return {
          id: followingId,
          documentId: followingDocumentId,
          username: followingUsername,
          displayName: followingDisplayName,
          profileImage: { url: profileImageUrl },
          isFollowing: true, // Always true since this is a list of users the profile is following
        }
      })
      .filter(Boolean) as FollowUser[]

    console.log(`Processed ${users.length} following`)

    return {
      users,
      total: followsResponse.meta?.pagination?.total || users.length,
      page: followsResponse.meta?.pagination?.page || page,
      pageSize: followsResponse.meta?.pagination?.pageSize || pageSize,
      totalPages: followsResponse.meta?.pagination?.pageCount || Math.ceil(users.length / pageSize),
      isAuthenticated,
    }
  } catch (error) {
    console.error("Error in getFollowing:", error)
    return {
      users: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      isAuthenticated: false,
    }
  }
}

// Toggle follow status for a user (requires authentication)
export async function toggleFollowStatus(
  targetUsername: string,
  currentlyFollowing: boolean,
): Promise<{ success: boolean; isFollowing: boolean; message?: string }> {
  try {
    // For server-side actions, we need to check for user authentication
    const cookieStore = cookies()
    const token = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value

    if (!token) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "Authentication required to follow users",
      }
    }

    const apiUrl = getApiUrl()

    // Get target user documentId
    const targetUserDocumentId = await getUserDocumentIdByUsername(targetUsername)
    if (!targetUserDocumentId) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "User not found",
      }
    }

    if (currentlyFollowing) {
      // Unfollow: Find and delete the follow relationship
      const followQuery = qs.stringify({
        filters: {
          $and: [
            {
              follower: {
                documentId: {
                  $eq: "me",
                },
              },
            },
            {
              following: {
                documentId: {
                  $eq: targetUserDocumentId,
                },
              },
            },
          ],
        },
      })

      // For user-specific actions, use the user's JWT token
      const followResponse = await fetch(`${apiUrl}/api/follows?${followQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`)
        return res.json()
      })

      const followId = followResponse.data?.[0]?.id || followResponse[0]?.id
      if (!followId) {
        return {
          success: true,
          isFollowing: false,
          message: "Already unfollowed",
        }
      }

      // Delete the follow relationship
      await fetch(`${apiUrl}/api/follows/${followId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`)
        return res.json()
      })

      // Revalidate the profile page to update counts
      revalidatePath(`/profile/${targetUsername}`)

      return {
        success: true,
        isFollowing: false,
      }
    } else {
      // Follow: Create a new follow relationship
      await fetch(`${apiUrl}/api/follows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            following: targetUserDocumentId,
          },
        }),
      }).then((res) => {
        if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`)
        return res.json()
      })

      // Revalidate the profile page to update counts
      revalidatePath(`/profile/${targetUsername}`)

      return {
        success: true,
        isFollowing: true,
      }
    }
  } catch (error) {
    console.error("Error toggling follow status:", error)
    return {
      success: false,
      isFollowing: currentlyFollowing,
      message: "Failed to update follow status",
    }
  }
}
