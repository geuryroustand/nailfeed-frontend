import qs from "qs"

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
  return process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

// Helper function to get API token - DIRECTLY use environment variable
function getApiToken(): string | null {
  // Directly use NEXT_PUBLIC_API_TOKEN
  return process.env.NEXT_PUBLIC_API_TOKEN || null
}

// Helper function for API requests with proper error handling
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    console.log(`Client API Request: ${url}`)

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
      cache: "no-store",
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

// Get user documentId by username
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

// Get followers for a user (client-side)
export async function getFollowers(username: string, page = 1, pageSize = 10): Promise<FollowListResponse> {
  try {
    const apiUrl = getApiUrl()
    const token = getApiToken()

    // Check if user is authenticated (for client-side)
    const isAuthenticated =
      typeof document !== "undefined" && (document.cookie.includes("jwt=") || document.cookie.includes("authToken="))

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
    console.log(`Client followers query: ${followersQuery}`)

    // Make the request with auth token
    const followsResponse = await apiRequest<any>(`${apiUrl}/api/follows?${followersQuery}`, {})

    // Log the response for debugging
    console.log(`Client followers response:`, followsResponse)

    // Process followers data based on the actual response structure
    const users = (followsResponse.data || [])
      .map((follow: any) => {
        const follower = follow.follower
        if (!follower) {
          console.log(`No follower data found in follow object`)
          return null
        }

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
          isFollowing: false, // We can't determine this on the client side without additional API calls
        }
      })
      .filter(Boolean) as FollowUser[]

    console.log(`Client processed ${users.length} followers`)

    return {
      users,
      total: followsResponse.meta?.pagination?.total || users.length,
      page: followsResponse.meta?.pagination?.page || page,
      pageSize: followsResponse.meta?.pagination?.pageSize || pageSize,
      totalPages: followsResponse.meta?.pagination?.pageCount || Math.ceil(users.length / pageSize),
      isAuthenticated,
    }
  } catch (error) {
    console.error("Error in client getFollowers:", error)
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

// Get users that a user is following (client-side)
export async function getFollowing(username: string, page = 1, pageSize = 10): Promise<FollowListResponse> {
  try {
    const apiUrl = getApiUrl()
    const token = getApiToken()

    // Check if user is authenticated (for client-side)
    const isAuthenticated =
      typeof document !== "undefined" && (document.cookie.includes("jwt=") || document.cookie.includes("authToken="))

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
    console.log(`Client following query: ${followingQuery}`)

    // Make the request with auth token
    const followsResponse = await apiRequest<any>(`${apiUrl}/api/follows?${followingQuery}`, {})

    // Log the response for debugging
    console.log(`Client following response:`, followsResponse)

    // Process following data based on the actual response structure
    const users = (followsResponse.data || [])
      .map((follow: any) => {
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

    console.log(`Client processed ${users.length} following`)

    return {
      users,
      total: followsResponse.meta?.pagination?.total || users.length,
      page: followsResponse.meta?.pagination?.page || page,
      pageSize: followsResponse.meta?.pagination?.pageSize || pageSize,
      totalPages: followsResponse.meta?.pagination?.pageCount || Math.ceil(users.length / pageSize),
      isAuthenticated,
    }
  } catch (error) {
    console.error("Error in client getFollowing:", error)
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

// Toggle follow status for a user (client-side)
export async function toggleFollowStatus(
  targetUsername: string,
  currentlyFollowing: boolean,
): Promise<{ success: boolean; isFollowing: boolean; message?: string }> {
  try {
    // For client-side, we need to make a POST request to the server action
    const response = await fetch("/api/follow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: targetUsername,
        unfollow: currentlyFollowing,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: errorData.message || "Failed to update follow status",
      }
    }

    const data = await response.json()
    return {
      success: true,
      isFollowing: !currentlyFollowing,
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
