import qs from "qs"

export interface NetworkUser {
  id: number | string
  username: string
  displayName?: string
  profileImage?: {
    url: string
    formats?: { thumbnail?: { url: string } }
  }
  isFollowing?: boolean
  follower?: NetworkUser
  following?: NetworkUser
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

function ensureAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`
}

/**
 * Get followers (client) via proxy without exposing secrets
 */
export async function getFollowers(username: string, page = 1, pageSize = 10): Promise<NetworkListResponse> {
  try {
    const isAuthenticated =
      typeof document !== "undefined" && (document.cookie.includes("jwt=") || document.cookie.includes("authToken="))

    // Fetch all users (light populate)
    const usersQuery = qs.stringify({ populate: ["profileImage"] }, { encodeValuesOnly: true })
    const usersResponse = await proxy<any>(`/api/users?${usersQuery}`)
    const allUsers = usersResponse || []

    // Find target user
    const userQuery = qs.stringify({ filters: { username: { $eq: username } } }, { encodeValuesOnly: true })
    const userResponse = await proxy<any>(`/api/users?${userQuery}`)
    const targetUser = userResponse[0] || (userResponse.data && userResponse.data[0])

    if (!targetUser) {
      return { users: [], total: 0, page, pageSize, totalPages: 0, isAuthenticated, usingSampleData: true }
    }

    const otherUsers = allUsers.filter((u: any) => u.id !== targetUser.id)

    const followerUsers: NetworkUser[] = otherUsers.map((u: any) => {
      let profileImageUrl: string | null = null
      if (u.profileImage) {
        const imageUrl = u.profileImage.url || u.profileImage?.data?.attributes?.url
        if (imageUrl) profileImageUrl = imageUrl
      }
      let thumbnailUrl: string | undefined
      if (u.profileImage?.formats?.thumbnail?.url) thumbnailUrl = u.profileImage.formats.thumbnail.url

      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName || u.username,
        profileImage: {
          url: profileImageUrl || "/abstract-user-icon.png",
          formats: thumbnailUrl ? { thumbnail: { url: thumbnailUrl } } : undefined,
        },
        isFollowing: false,
      }
    })

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
    console.error("Client: Error in getFollowers:", error)
    return { users: [], total: 0, page, pageSize, totalPages: 0, isAuthenticated: false, usingSampleData: true }
  }
}

/**
 * Get following (client) via proxy without exposing secrets
 */
export async function getFollowing(username: string, page = 1, pageSize = 10): Promise<NetworkListResponse> {
  try {
    const isAuthenticated =
      typeof document !== "undefined" && (document.cookie.includes("jwt=") || document.cookie.includes("authToken="))

    // Optimized query
    const query = {
      filters: { username: { $eq: username } },
      populate: [
        "profileImage",
        "coverImage",
        "following.follower.profileImage",
        "following.follower.coverImage",
        "following.following.profileImage",
        "following.following.coverImage",
      ],
    }
    const queryString = qs.stringify(query, { encodeValuesOnly: true })
    const userData = await proxy<any>(`/api/users?${queryString}`)

    const user = userData[0] || (userData.data && userData.data[0])
    if (!user) {
      return { users: [], total: 0, page, pageSize, totalPages: 0, isAuthenticated, usingSampleData: true }
    }

    const following = user.following || []
    const publishedFollowing = following.filter((f: any) => f.publishedAt !== null)

    const followingUsers: NetworkUser[] = []
    const processedIds = new Set()

    for (const follow of publishedFollowing) {
      if (follow.id && !processedIds.has(follow.id)) {
        processedIds.add(follow.id)
        followingUsers.push({
          id: follow.id,
          username: `user-${follow.id}`,
          displayName: `User ${follow.id}`,
          profileImage: { url: "/abstract-user-icon.png" },
          isFollowing: false,
        })
      }
    }

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
    console.error("Client: Error in getFollowing:", error)
    return { users: [], total: 0, page, pageSize, totalPages: 0, isAuthenticated: false, usingSampleData: true }
  }
}

/**
 * Toggle follow status (client) via proxy without exposing secrets
 */
export async function toggleFollowStatus(
  targetUsername: string,
  currentlyFollowing: boolean,
): Promise<{ success: boolean; isFollowing: boolean; message?: string }> {
  try {
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: targetUsername, unfollow: currentlyFollowing }),
    })

    if (!res.ok) {
      let message = "Failed to update follow status"
      try {
        const data = await res.json()
        if (data && typeof data.message === "string") message = data.message
      } catch {
        // ignore JSON parse errors
      }
      return { success: false, isFollowing: currentlyFollowing, message }
    }

    // consume response body to avoid leaking a reader
    await res.json().catch(() => ({}))

    return { success: true, isFollowing: !currentlyFollowing }
  } catch (error) {
    console.error("Client: Error toggling follow status:", error)
    return { success: false, isFollowing: currentlyFollowing, message: "Failed to update follow status" }
  }
}
