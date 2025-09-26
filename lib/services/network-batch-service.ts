import qs from "qs"

/**
 * Optimized network service that fetches both followers and following in batched requests
 * Reduces API calls and improves performance
 */

export interface NetworkUser {
  id: number
  documentId: string
  username: string
  displayName?: string
  profileImage?: {
    url: string
    alternativeText?: string
  }
  isVerified?: boolean
}

export interface NetworkData {
  followers: {
    users: NetworkUser[]
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
  following: {
    users: NetworkUser[]
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
}

// Helper to call server proxy
async function proxy<T>(endpoint: string) {
  const res = await fetch("/api/auth-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, method: "GET" }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API Error: ${res.status} ${text}`)
  }
  return (await res.json()) as T
}

// Convert documentId to username if needed
async function getUsernameFromDocumentId(documentId: string): Promise<string | null> {
  try {
    const query = qs.stringify({
      filters: { documentId: { $eq: documentId } }
    })
    const userResponse = await proxy<any>(`/api/users?${query}`)
    const userData = userResponse.data || userResponse
    if (!userData || !userData.length) return null
    return userData[0].username || null
  } catch (error) {
    console.error(`Error fetching username for documentId ${documentId}:`, error)
    return null
  }
}

// Process follow data into user format
function processFollowData(data: any[], type: 'followers' | 'following'): NetworkUser[] {
  return data.map((follow: any) => {
    const user = type === 'followers' ? follow.follower : follow.following
    if (!user) return null

    return {
      id: user.id,
      documentId: user.documentId,
      username: user.username,
      displayName: user.displayName || user.username,
      profileImage: user.profileImage ? {
        url: user.profileImage.url.startsWith("http")
          ? user.profileImage.url
          : `${process.env.NEXT_PUBLIC_API_URL || ""}${user.profileImage.url}`
      } : undefined,
      isVerified: user.isVerified || false,
    }
  }).filter(Boolean)
}

/**
 * Fetch both followers and following data in a single optimized batch
 * This reduces API calls from 4+ to 2 requests
 */
export async function fetchNetworkDataBatch(
  userIdOrUsername?: string,
  followersPage = 1,
  followingPage = 1,
  pageSize = 10
): Promise<NetworkData | { error: true; message: string }> {
  try {
    if (!userIdOrUsername) {
      throw new Error("User identifier is required")
    }

    // Convert documentId to username if needed
    let targetUsername = userIdOrUsername
    if (userIdOrUsername.length > 20) { // documentId is longer than typical username
      const username = await getUsernameFromDocumentId(userIdOrUsername)
      if (!username) {
        throw new Error("User not found")
      }
      targetUsername = username
    }

    // Get user's documentId
    const userQuery = qs.stringify({
      filters: { username: { $eq: targetUsername } }
    })
    const userResponse = await proxy<any>(`/api/users?${userQuery}`)
    const userData = userResponse.data || userResponse
    if (!userData || !userData.length) {
      throw new Error("User not found")
    }
    const userDocumentId = userData[0].documentId

    // Fetch both followers and following in parallel (2 requests instead of 4+)
    const [followersResponse, followingResponse] = await Promise.all([
      // Followers query
      proxy<any>(`/api/follows?${qs.stringify({
        filters: { following: { documentId: { $eq: userDocumentId } } },
        populate: {
          follower: {
            populate: ['profileImage']
          }
        },
        pagination: { page: followersPage, pageSize },
        sort: ["createdAt:desc"],
      })}`),

      // Following query
      proxy<any>(`/api/follows?${qs.stringify({
        filters: { follower: { documentId: { $eq: userDocumentId } } },
        populate: {
          following: {
            populate: ['profileImage']
          }
        },
        pagination: { page: followingPage, pageSize },
        sort: ["createdAt:desc"],
      })}`)
    ])

    // Process the data
    const followersUsers = processFollowData(followersResponse.data || [], 'followers')
    const followingUsers = processFollowData(followingResponse.data || [], 'following')

    return {
      followers: {
        users: followersUsers,
        total: followersResponse.meta?.pagination?.total || followersUsers.length,
        page: followersResponse.meta?.pagination?.page || followersPage,
        pageSize: followersResponse.meta?.pagination?.pageSize || pageSize,
        pageCount: followersResponse.meta?.pagination?.pageCount || Math.ceil(followersUsers.length / pageSize),
      },
      following: {
        users: followingUsers,
        total: followingResponse.meta?.pagination?.total || followingUsers.length,
        page: followingResponse.meta?.pagination?.page || followingPage,
        pageSize: followingResponse.meta?.pagination?.pageSize || pageSize,
        pageCount: followingResponse.meta?.pagination?.pageCount || Math.ceil(followingUsers.length / pageSize),
      }
    }
  } catch (error) {
    console.error("Error fetching network data batch:", error)
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Fetch preview data for both networks (small batch for homepage preview)
 * Optimized for quick loading with minimal data
 */
export async function fetchNetworkPreview(
  userIdOrUsername?: string,
  previewSize = 3
): Promise<NetworkData | { error: true; message: string }> {
  return fetchNetworkDataBatch(userIdOrUsername, 1, 1, previewSize)
}