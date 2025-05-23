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

// Helper function to get API token
function getApiToken(): string | null {
  return process.env.NEXT_PUBLIC_API_TOKEN || null
}

// Get user by username
async function getUserByUsername(username: string): Promise<any> {
  try {
    const apiUrl = getApiUrl()
    const token = getApiToken()

    if (!token) {
      console.error("No API token available")
      throw new Error("No API token available")
    }

    const query = qs.stringify({
      filters: {
        username: {
          $eq: username,
        },
      },
    })

    const response = await fetch(`${apiUrl}/api/users?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.data?.[0] || data[0] || null
  } catch (error) {
    console.error(`Error fetching user by username:`, error)
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

    // First, get the user
    const user = await getUserByUsername(username)
    if (!user) {
      console.error(`User not found: ${username}`)
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      }
    }

    console.log(`Client found user:`, user)

    // Now, get the followers using a direct API call
    // We need to get all users who have a follow relationship where the following is our user
    const followersQuery = qs.stringify({
      populate: ["follower", "follower.profileImage"],
      filters: {
        following: {
          id: {
            $eq: user.id,
          },
        },
      },
      pagination: {
        page,
        pageSize,
      },
    })

    console.log(`Client direct followers query: ${followersQuery}`)

    const followersResponse = await fetch(`${apiUrl}/api/follows?${followersQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!followersResponse.ok) {
      throw new Error(`API Error: ${followersResponse.status} ${followersResponse.statusText}`)
    }

    const followersData = await followersResponse.json()
    console.log(`Client direct followers response:`, followersData)

    // Process the followers data
    const users = (followersData.data || [])
      .map((follow: any) => {
        // For each follow relationship, extract the follower
        const follower = follow.attributes?.follower?.data || follow.follower

        if (!follower) {
          console.log(`Client: No follower data found in follow relationship:`, follow)
          return null
        }

        // Extract the follower attributes
        const followerData = follower.attributes || follower

        // Extract user data
        const followerId = follower.id
        const followerUsername = followerData.username
        const followerDisplayName = followerData.displayName || followerUsername

        // Handle profile image URL
        let profileImageUrl = "/abstract-user-icon.png"
        if (followerData.profileImage) {
          const profileImage = followerData.profileImage.data || followerData.profileImage
          if (profileImage) {
            const imageUrl = profileImage.attributes?.url || profileImage.url
            if (imageUrl) {
              profileImageUrl = imageUrl.startsWith("http") ? imageUrl : `${apiUrl}${imageUrl}`
            }
          }
        }

        return {
          id: followerId,
          documentId: followerData.documentId || `follower-${followerId}`,
          username: followerUsername,
          displayName: followerDisplayName,
          profileImage: { url: profileImageUrl },
          isFollowing: false, // We'll set this later if needed
        }
      })
      .filter(Boolean) as FollowUser[]

    console.log(`Client processed ${users.length} followers`)

    return {
      users,
      total: followersData.meta?.pagination?.total || users.length,
      page: followersData.meta?.pagination?.page || page,
      pageSize: followersData.meta?.pagination?.pageSize || pageSize,
      totalPages: followersData.meta?.pagination?.pageCount || Math.ceil(users.length / pageSize),
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

    // First, get the user
    const user = await getUserByUsername(username)
    if (!user) {
      console.error(`User not found: ${username}`)
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      }
    }

    console.log(`Client found user:`, user)

    // Now, get the following using a direct API call
    // We need to get all users who have a follow relationship where the follower is our user
    const followingQuery = qs.stringify({
      populate: ["following", "following.profileImage"],
      filters: {
        follower: {
          id: {
            $eq: user.id,
          },
        },
      },
      pagination: {
        page,
        pageSize,
      },
    })

    console.log(`Client direct following query: ${followingQuery}`)

    const followingResponse = await fetch(`${apiUrl}/api/follows?${followingQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!followingResponse.ok) {
      throw new Error(`API Error: ${followingResponse.status} ${followingResponse.statusText}`)
    }

    const followingData = await followingResponse.json()
    console.log(`Client direct following response:`, followingData)

    // Process the following data
    const users = (followingData.data || [])
      .map((follow: any) => {
        // For each follow relationship, extract the following
        const following = follow.attributes?.following?.data || follow.following

        if (!following) {
          console.log(`Client: No following data found in follow relationship:`, follow)
          return null
        }

        // Extract the following attributes
        const followingData = following.attributes || following

        // Extract user data
        const followingId = following.id
        const followingUsername = followingData.username
        const followingDisplayName = followingData.displayName || followingUsername

        // Handle profile image URL
        let profileImageUrl = "/abstract-user-icon.png"
        if (followingData.profileImage) {
          const profileImage = followingData.profileImage.data || followingData.profileImage
          if (profileImage) {
            const imageUrl = profileImage.attributes?.url || profileImage.url
            if (imageUrl) {
              profileImageUrl = imageUrl.startsWith("http") ? imageUrl : `${apiUrl}${imageUrl}`
            }
          }
        }

        return {
          id: followingId,
          documentId: followingData.documentId || `following-${followingId}`,
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
      total: followingData.meta?.pagination?.total || users.length,
      page: followingData.meta?.pagination?.page || page,
      pageSize: followingData.meta?.pagination?.pageSize || pageSize,
      totalPages: followingData.meta?.pagination?.pageCount || Math.ceil(users.length / pageSize),
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
