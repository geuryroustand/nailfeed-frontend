import qs from "qs"

/**
 * Client-side profile service for use in Client Components
 * Uses proper Strapi v5 API structure for fetching followers/following
 */

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

// Helper to convert documentId to username if needed
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

/**
 * Client-side function to fetch followers by documentId or username
 */
export async function fetchUserFollowersClient(
  userIdOrUsername?: string,
  page = 1,
  pageSize = 25
): Promise<{ data: any[]; pagination: any } | { error: true; message: string }> {
  try {
    if (!userIdOrUsername) {
      throw new Error("User identifier is required")
    }

    // Convert documentId to username if needed (documentId has specific pattern)
    let targetUsername = userIdOrUsername
    if (userIdOrUsername.length > 20) { // documentId is longer than typical username
      const username = await getUsernameFromDocumentId(userIdOrUsername)
      if (!username) {
        throw new Error("User not found")
      }
      targetUsername = username
    }

    // Get user's documentId for the query
    const userQuery = qs.stringify({
      filters: { username: { $eq: targetUsername } }
    })
    const userResponse = await proxy<any>(`/api/users?${userQuery}`)
    const userData = userResponse.data || userResponse
    if (!userData || !userData.length) {
      throw new Error("User not found")
    }
    const userDocumentId = userData[0].documentId

    // Query followers using Strapi v5 structure
    const followersQuery = qs.stringify({
      filters: { following: { documentId: { $eq: userDocumentId } } },
      populate: {
        follower: {
          populate: ['profileImage']
        }
      },
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
    })

    const followsResponse = await proxy<any>(`/api/follows?${followersQuery}`)

    const users = (followsResponse.data || [])
      .map((follow: any) => {
        const follower = follow.follower
        if (!follower) return null

        return {
          id: follower.id,
          documentId: follower.documentId,
          username: follower.username,
          displayName: follower.displayName || follower.username,
          profileImage: follower.profileImage ? {
            url: follower.profileImage.url.startsWith("http")
              ? follower.profileImage.url
              : `${process.env.NEXT_PUBLIC_API_URL || ""}${follower.profileImage.url}`
          } : undefined,
        }
      })
      .filter(Boolean)

    return {
      data: users,
      pagination: {
        page: followsResponse.meta?.pagination?.page || page,
        pageSize: followsResponse.meta?.pagination?.pageSize || pageSize,
        total: followsResponse.meta?.pagination?.total || users.length,
        pageCount: followsResponse.meta?.pagination?.pageCount || Math.ceil(users.length / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching followers:", error)
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Client-side function to fetch following by documentId or username
 */
export async function fetchUserFollowingClient(
  userIdOrUsername?: string,
  page = 1,
  pageSize = 25
): Promise<{ data: any[]; pagination: any } | { error: true; message: string }> {
  try {
    if (!userIdOrUsername) {
      throw new Error("User identifier is required")
    }

    // Convert documentId to username if needed (documentId has specific pattern)
    let targetUsername = userIdOrUsername
    if (userIdOrUsername.length > 20) { // documentId is longer than typical username
      const username = await getUsernameFromDocumentId(userIdOrUsername)
      if (!username) {
        throw new Error("User not found")
      }
      targetUsername = username
    }

    // Get user's documentId for the query
    const userQuery = qs.stringify({
      filters: { username: { $eq: targetUsername } }
    })
    const userResponse = await proxy<any>(`/api/users?${userQuery}`)
    const userData = userResponse.data || userResponse
    if (!userData || !userData.length) {
      throw new Error("User not found")
    }
    const userDocumentId = userData[0].documentId

    // Query following using Strapi v5 structure
    const followingQuery = qs.stringify({
      filters: { follower: { documentId: { $eq: userDocumentId } } },
      populate: {
        following: {
          populate: ['profileImage']
        }
      },
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
    })

    const followsResponse = await proxy<any>(`/api/follows?${followingQuery}`)

    const users = (followsResponse.data || [])
      .map((follow: any) => {
        const following = follow.following
        if (!following) return null

        return {
          id: following.id,
          documentId: following.documentId,
          username: following.username,
          displayName: following.displayName || following.username,
          profileImage: following.profileImage ? {
            url: following.profileImage.url.startsWith("http")
              ? following.profileImage.url
              : `${process.env.NEXT_PUBLIC_API_URL || ""}${following.profileImage.url}`
          } : undefined,
        }
      })
      .filter(Boolean)

    return {
      data: users,
      pagination: {
        page: followsResponse.meta?.pagination?.page || page,
        pageSize: followsResponse.meta?.pagination?.pageSize || pageSize,
        total: followsResponse.meta?.pagination?.total || users.length,
        pageCount: followsResponse.meta?.pagination?.pageCount || Math.ceil(users.length / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching following:", error)
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}