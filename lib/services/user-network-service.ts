"use server"

import qs from "qs"
import { cookies } from "next/headers"

export type NetworkUser = {
  id: number
  documentId: string
  username: string
  displayName: string
  profileImage?: {
    url: string
    formats?: {
      thumbnail?: { url: string }
    }
  }
  isFollowing?: boolean
}

export type NetworkListResponse = {
  users: NetworkUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isAuthenticated: boolean
  usingSampleData: boolean
}

// Helper function to get API URL
function getApiUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

// Helper function to get auth token
function getApiToken(): string | null {
  return process.env.API_TOKEN || process.env.NEXT_PUBLIC_API_TOKEN || null
}

// Helper function to ensure URL is absolute
function ensureAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`
}

/**
 * Get followers for a user with optimized data fetching
 */
export async function getFollowers(username: string, page = 1, pageSize = 10): Promise<NetworkListResponse> {
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
        usingSampleData: true,
      }
    }

    // First, get the user's followers relationships
    const userQuery = qs.stringify(
      {
        filters: {
          username: {
            $eq: username,
          },
        },
        populate: ["followers"],
      },
      { encodeValuesOnly: true },
    )

    console.log(`Fetching user with followers: ${apiUrl}/api/users?${userQuery}`)

    const userResponse = await fetch(`${apiUrl}/api/users?${userQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    })

    if (!userResponse.ok) {
      throw new Error(`API Error: ${userResponse.status} ${userResponse.statusText}`)
    }

    const userData = await userResponse.json()
    const user = userData[0] || (userData.data && userData.data[0])

    if (!user) {
      console.error(`User not found: ${username}`)
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
        usingSampleData: true,
      }
    }

    // Get the followers relationships
    const followers = user.followers || []

    // Filter out unpublished followers
    const publishedFollowers = followers.filter((follow: any) => follow.publishedAt !== null)

    // Since the follower field is null, we need to fetch the follower users separately
    // First, collect all the follower relationship IDs
    const followerRelationIds = publishedFollowers.map((follow: any) => follow.id)

    if (followerRelationIds.length === 0) {
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
        usingSampleData: false,
      }
    }

    // Now, fetch all users who have a follow relationship with this user
    // We need to query for users where their ID matches the follower relationship ID
    const followersQuery = qs.stringify(
      {
        populate: ["profileImage"],
      },
      { encodeValuesOnly: true },
    )

    console.log(`Fetching followers: ${apiUrl}/api/users?${followersQuery}`)

    const followersResponse = await fetch(`${apiUrl}/api/users?${followersQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    })

    if (!followersResponse.ok) {
      throw new Error(`API Error: ${followersResponse.status} ${followersResponse.statusText}`)
    }

    const followersData = await followersResponse.json()
    const allUsers = followersData || []

    // Filter to only include users who are not the profile owner
    const followerUsers = allUsers
      .filter((u: any) => u.id !== user.id)
      .map((followerUser: any) => {
        // Extract profile image URL
        let profileImageUrl = null
        if (followerUser.profileImage) {
          const imageUrl = followerUser.profileImage.url
          if (imageUrl) {
            // Don't prepend the API URL here, we'll do it in the component
            profileImageUrl = imageUrl
          }
        }

        // Create thumbnail URL if available
        let thumbnailUrl = undefined
        if (followerUser.profileImage?.formats?.thumbnail?.url) {
          // Don't prepend the API URL here, we'll do it in the component
          thumbnailUrl = followerUser.profileImage.formats.thumbnail.url
        }

        return {
          id: followerUser.id,
          documentId: followerUser.documentId || `user-${followerUser.id}`,
          username: followerUser.username,
          displayName: followerUser.displayName || followerUser.username,
          profileImage: {
            url: profileImageUrl,
            formats: thumbnailUrl
              ? {
                  thumbnail: { url: thumbnailUrl },
                }
              : undefined,
          },
          isFollowing: false, // Default value, will be updated below if authenticated
        }
      })

    // Get current user's following list if authenticated to set isFollowing flag
    if (isAuthenticated && userToken) {
      try {
        const meResponse = await fetch(`${apiUrl}/api/users/me?populate=following`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          next: { revalidate: 0 },
        })

        if (meResponse.ok) {
          const meData = await meResponse.json()
          const currentUserFollowing = (meData.following || []).map(
            (follow: any) => follow.id?.toString() || follow.following?.id?.toString() || "",
          )

          // Update isFollowing flag for each follower
          followerUsers.forEach((user) => {
            user.isFollowing = currentUserFollowing.includes(user.id.toString())
          })
        }
      } catch (error) {
        console.error("Error fetching current user following:", error)
      }
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize
    const paginatedUsers = followerUsers.slice(startIndex, startIndex + pageSize)
    const totalPages = Math.ceil(followerUsers.length / pageSize)

    return {
      users: paginatedUsers,
      total: followerUsers.length,
      page,
      pageSize,
      totalPages,
      isAuthenticated,
      usingSampleData: false,
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
      usingSampleData: true,
    }
  }
}

/**
 * Get users that a user is following with optimized data fetching
 */
export async function getFollowing(username: string, page = 1, pageSize = 10): Promise<NetworkListResponse> {
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
        usingSampleData: true,
      }
    }

    // Build the optimized query with deep population
    const query = {
      filters: {
        username: {
          $eq: username,
        },
      },
      populate: [
        "profileImage",
        "coverImage",
        "following.follower.profileImage",
        "following.follower.coverImage",
        "following.following.profileImage",
        "following.following.coverImage",
      ],
    }

    // Convert to query string
    const queryString = qs.stringify(query, { encodeValuesOnly: true })

    console.log(`Fetching user with optimized following query: ${apiUrl}/api/users?${queryString}`)

    const response = await fetch(`${apiUrl}/api/users?${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const userData = await response.json()
    console.log("User data with following:", userData)

    // Extract the user from the response
    const user = userData[0] || (userData.data && userData.data[0])
    if (!user) {
      console.error(`User not found: ${username}`)
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
        usingSampleData: true,
      }
    }

    // Process following from the nested data
    const following = user.following || []

    // Filter out unpublished following
    const publishedFollowing = following.filter((follow: any) => follow.publishedAt !== null)

    // Extract following users from the relationship
    const followingUsers: NetworkUser[] = []
    const processedIds = new Set()

    for (const follow of publishedFollowing) {
      // In this API structure, we need to look at who the user is following
      // We'll need to make an additional request to get the following user details
      const followingId = follow.id

      if (followingId && !processedIds.has(followingId)) {
        processedIds.add(followingId)

        try {
          // Get the following user details
          const followingQuery = qs.stringify(
            {
              filters: {
                following: {
                  id: {
                    $eq: followingId,
                  },
                },
              },
              populate: ["profileImage"],
            },
            {
              encodeValuesOnly: true,
            },
          )

          const followingResponse = await fetch(`${apiUrl}/api/users?${followingQuery}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            next: { revalidate: 0 },
          })

          if (followingResponse.ok) {
            const followingData = await followingResponse.json()
            const followingUser = followingData[0] || (followingData.data && followingData.data[0])

            if (followingUser) {
              // Extract profile image URL
              let profileImageUrl = "/abstract-user-icon.png"
              if (followingUser.profileImage) {
                const imageUrl = followingUser.profileImage.url
                if (imageUrl) {
                  profileImageUrl = ensureAbsoluteUrl(imageUrl, apiUrl)
                }
              }

              // Create thumbnail URL if available
              let thumbnailUrl = undefined
              if (followingUser.profileImage?.formats?.thumbnail?.url) {
                thumbnailUrl = ensureAbsoluteUrl(followingUser.profileImage.formats.thumbnail.url, apiUrl)
              }

              followingUsers.push({
                id: followingUser.id,
                documentId: followingUser.documentId || `user-${followingUser.id}`,
                username: followingUser.username,
                displayName: followingUser.displayName || followingUser.username,
                profileImage: {
                  url: profileImageUrl,
                  formats: thumbnailUrl
                    ? {
                        thumbnail: { url: thumbnailUrl },
                      }
                    : undefined,
                },
                isFollowing: true, // Always true since this is a list of users the profile is following
              })
            }
          }
        } catch (error) {
          console.error(`Error fetching following details for ID ${followingId}:`, error)
        }
      }
    }

    // Get current user's following list if authenticated to set isFollowing flag
    if (isAuthenticated && userToken) {
      try {
        // Use /api/users/me for the current user's following list
        const meResponse = await fetch(`${apiUrl}/api/users/me?populate=following`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          next: { revalidate: 0 },
        })

        if (meResponse.ok) {
          const meData = await meResponse.json()
          const currentUserFollowing = (meData.following || []).map(
            (follow: any) => follow.id?.toString() || follow.following?.id?.toString() || "",
          )

          // Update isFollowing flag for each follower
          followingUsers.forEach((user) => {
            user.isFollowing = currentUserFollowing.includes(user.id.toString())
          })
        }
      } catch (error) {
        console.error("Error fetching current user following:", error)
      }
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize
    const paginatedUsers = followingUsers.slice(startIndex, startIndex + pageSize)
    const totalPages = Math.ceil(followingUsers.length / pageSize)

    return {
      users: paginatedUsers,
      total: followingUsers.length,
      page,
      pageSize,
      totalPages,
      isAuthenticated,
      usingSampleData: false,
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
      usingSampleData: true,
    }
  }
}

/**
 * Toggle follow status for a user (requires authentication)
 */
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

    // First, get the target user ID
    const userQuery = qs.stringify(
      {
        filters: {
          username: {
            $eq: targetUsername,
          },
        },
      },
      {
        encodeValuesOnly: true,
      },
    )

    const userResponse = await fetch(`${apiUrl}/api/users?${userQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error(`API Error: ${userResponse.status} ${userResponse.statusText}`)
    }

    const userData = await userResponse.json()
    const targetUser = userData.data?.[0] || userData[0]

    if (!targetUser) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "User not found",
      }
    }

    const targetUserId = targetUser.id

    if (currentlyFollowing) {
      // Unfollow: Find and delete the follow relationship
      // First, get the current user's following list
      const meResponse = await fetch(`${apiUrl}/api/users/me?populate=following`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!meResponse.ok) {
        throw new Error(`API Error: ${meResponse.status} ${meResponse.statusText}`)
      }

      const meData = await meResponse.json()

      // Find the follow relationship to delete
      const followToDelete = (meData.following || []).find((follow: any) => {
        return follow.id === targetUserId
      })

      if (!followToDelete) {
        return {
          success: true,
          isFollowing: false,
          message: "Already unfollowed",
        }
      }

      // Delete the follow relationship
      const unfollowResponse = await fetch(`${apiUrl}/api/users/unfollow/${targetUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!unfollowResponse.ok) {
        throw new Error(`API Error: ${unfollowResponse.status} ${unfollowResponse.statusText}`)
      }

      return {
        success: true,
        isFollowing: false,
      }
    } else {
      // Follow: Create a new follow relationship
      const followResponse = await fetch(`${apiUrl}/api/users/follow/${targetUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!followResponse.ok) {
        throw new Error(`API Error: ${followResponse.status} ${followResponse.statusText}`)
      }

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
