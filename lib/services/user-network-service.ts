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

// Helper function to get auth token (server-only)
function getApiToken(): string | null {
  // Important: do not read any NEXT_PUBLIC_ secret here
  return process.env.API_TOKEN || null
}

// Helper function to ensure URL is absolute
function ensureAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`
}

/**
 * Get followers for a user with optimized data fetching using Strapi v5 follow model
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

    const userQuery = qs.stringify(
      {
        filters: {
          username: {
            $eq: username,
          },
        },
      },
      { encodeValuesOnly: true },
    )

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
    const targetUser = userData[0] || (userData.data && userData.data[0])

    if (!targetUser) {
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

    const followsQuery = qs.stringify(
      {
        "filters[following][id][$eq]": targetUser.id,
        "populate[follower][fields][0]": "id",
        "populate[follower][fields][1]": "username",
        "populate[follower][fields][2]": "displayName",
        "populate[follower][populate][profileImage]": true,
        sort: "createdAt:desc",
        "pagination[page]": page,
        "pagination[pageSize]": pageSize,
      },
      { encodeValuesOnly: true },
    )

    console.log(`[v0] Fetching followers for ${username} (ID: ${targetUser.id}): ${apiUrl}/api/follows?${followsQuery}`)

    const followsResponse = await fetch(`${apiUrl}/api/follows?${followsQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    })

    if (!followsResponse.ok) {
      throw new Error(`API Error: ${followsResponse.status} ${followsResponse.statusText}`)
    }

    const followsData = await followsResponse.json()
    console.log(`[v0] Followers API response for ${username}:`, JSON.stringify(followsData, null, 2))

    const follows = followsData.data || []
    const meta = followsData.meta || {}

    const followerUsers: NetworkUser[] = follows
      .filter((follow: any) => follow.follower && follow.follower.id !== targetUser.id)
      .map((follow: any) => {
        const followerUser = follow.follower

        // Extract profile image URL
        let profileImageUrl = "/abstract-user-icon.png"
        if (followerUser.profileImage) {
          const imageUrl = followerUser.profileImage.url
          if (imageUrl) {
            profileImageUrl = ensureAbsoluteUrl(imageUrl, apiUrl)
          }
        }

        // Create thumbnail URL if available
        let thumbnailUrl = undefined
        if (followerUser.profileImage?.formats?.thumbnail?.url) {
          thumbnailUrl = ensureAbsoluteUrl(followerUser.profileImage.formats.thumbnail.url, apiUrl)
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
          isFollowing: false, // Will be updated below if authenticated
        }
      })

    if (isAuthenticated && userToken) {
      try {
        const meResponse = await fetch(`${apiUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          next: { revalidate: 0 },
        })

        if (meResponse.ok) {
          const meData = await meResponse.json()
          const currentUserId = meData.id

          const currentUserFollowingQuery = qs.stringify(
            {
              filters: {
                follower: {
                  id: {
                    $eq: currentUserId,
                  },
                },
              },
              populate: ["following"],
            },
            { encodeValuesOnly: true },
          )

          const currentUserFollowingResponse = await fetch(`${apiUrl}/api/follows?${currentUserFollowingQuery}`, {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            next: { revalidate: 0 },
          })

          if (currentUserFollowingResponse.ok) {
            const currentUserFollowingData = await currentUserFollowingResponse.json()
            const followingIds = (currentUserFollowingData.data || []).map((follow: any) => follow.following?.id)

            followerUsers.forEach((u) => {
              u.isFollowing = followingIds.includes(u.id)
            })
          }
        }
      } catch (error) {
        console.error("Error fetching current user following:", error)
      }
    }

    const actualTotal = followerUsers.length
    const actualTotalPages = Math.ceil(actualTotal / pageSize)

    console.log(`[v0] Followers result for ${username}: ${followerUsers.length} users, total: ${actualTotal}`)

    return {
      users: followerUsers,
      total: actualTotal,
      page: meta.pagination?.page || page,
      pageSize: meta.pagination?.pageSize || pageSize,
      totalPages: actualTotalPages,
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
 * Get users that a user is following with optimized data fetching using Strapi v5 follow model
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

    const userQuery = qs.stringify(
      {
        filters: {
          username: {
            $eq: username,
          },
        },
      },
      { encodeValuesOnly: true },
    )

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
    const targetUser = userData[0] || (userData.data && userData.data[0])

    if (!targetUser) {
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

    const followsQuery = qs.stringify(
      {
        "filters[follower][id][$eq]": targetUser.id,
        "populate[following][fields][0]": "id",
        "populate[following][fields][1]": "username",
        "populate[following][fields][2]": "displayName",
        "populate[following][populate][profileImage]": true,
        sort: "createdAt:desc",
        "pagination[page]": page,
        "pagination[pageSize]": pageSize,
      },
      { encodeValuesOnly: true },
    )

    console.log(`[v0] Fetching following for ${username} (ID: ${targetUser.id}): ${apiUrl}/api/follows?${followsQuery}`)

    const followsResponse = await fetch(`${apiUrl}/api/follows?${followsQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    })

    if (!followsResponse.ok) {
      throw new Error(`API Error: ${followsResponse.status} ${followsResponse.statusText}`)
    }

    const followsData = await followsResponse.json()
    console.log(`[v0] Following API response for ${username}:`, JSON.stringify(followsData, null, 2))

    const follows = followsData.data || []
    const meta = followsData.meta || {}

    const followingUsers: NetworkUser[] = follows
      .filter((follow: any) => follow.following && follow.following.id !== targetUser.id)
      .map((follow: any) => {
        const followingUser = follow.following

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

        return {
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
          isFollowing: true, // They are following these users by definition
        }
      })

    if (isAuthenticated && userToken) {
      try {
        const meResponse = await fetch(`${apiUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          next: { revalidate: 0 },
        })

        if (meResponse.ok) {
          const meData = await meResponse.json()
          const currentUserId = meData.id

          const currentUserFollowingQuery = qs.stringify(
            {
              filters: {
                follower: {
                  id: {
                    $eq: currentUserId,
                  },
                },
              },
              populate: ["following"],
            },
            { encodeValuesOnly: true },
          )

          const currentUserFollowingResponse = await fetch(`${apiUrl}/api/follows?${currentUserFollowingQuery}`, {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            next: { revalidate: 0 },
          })

          if (currentUserFollowingResponse.ok) {
            const currentUserFollowingData = await currentUserFollowingResponse.json()
            const followingIds = (currentUserFollowingData.data || []).map((follow: any) => follow.following?.id)

            followingUsers.forEach((u) => {
              u.isFollowing = followingIds.includes(u.id)
            })
          }
        }
      } catch (error) {
        console.error("Error fetching current user following:", error)
      }
    }

    const actualTotal = followingUsers.length
    const actualTotalPages = Math.ceil(actualTotal / pageSize)

    console.log(`[v0] Following result for ${username}: ${followingUsers.length} users, total: ${actualTotal}`)

    return {
      users: followingUsers,
      total: actualTotal,
      page: meta.pagination?.page || page,
      pageSize: meta.pagination?.pageSize || pageSize,
      totalPages: actualTotalPages,
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
      // Unfollow
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
      // Follow
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
