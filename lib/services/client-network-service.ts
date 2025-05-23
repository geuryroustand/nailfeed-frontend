import qs from "qs"

export interface NetworkUser {
  id: number | string
  username: string
  displayName?: string
  profileImage?: {
    url: string
    formats?: {
      thumbnail?: {
        url: string
      }
    }
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

// Helper function to get API URL
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

// Helper function to get API token
function getApiToken(): string | null {
  return process.env.NEXT_PUBLIC_API_TOKEN || null
}

// Helper function to ensure URL is absolute
function ensureAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`
}

/**
 * Get followers for a user with optimized data fetching (client-side)
 */
export async function getFollowers(username: string, page = 1, pageSize = 10): Promise<NetworkListResponse> {
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
        usingSampleData: true,
      }
    }

    // First, get all users from the API
    const usersQuery = qs.stringify(
      {
        populate: ["profileImage"],
      },
      { encodeValuesOnly: true },
    )

    console.log(`Client: Fetching all users: ${apiUrl}/api/users?${usersQuery}`)

    const usersResponse = await fetch(`${apiUrl}/api/users?${usersQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!usersResponse.ok) {
      throw new Error(`API Error: ${usersResponse.status} ${usersResponse.statusText}`)
    }

    const usersData = await usersResponse.json()
    const allUsers = usersData || []

    // Then, get the target user to find their ID
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

    console.log(`Client: Fetching target user: ${apiUrl}/api/users?${userQuery}`)

    const userResponse = await fetch(`${apiUrl}/api/users?${userQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!userResponse.ok) {
      throw new Error(`API Error: ${userResponse.status} ${userResponse.statusText}`)
    }

    const userData = await userResponse.json()
    const targetUser = userData[0] || (userData.data && userData.data[0])

    if (!targetUser) {
      console.error(`Client: User not found: ${username}`)
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

    // Filter out the target user from the list of all users
    // These are potential followers
    const otherUsers = allUsers.filter((user: any) => user.id !== targetUser.id)

    // Process each user to create a proper NetworkUser object
    const followerUsers: NetworkUser[] = otherUsers.map((user: any) => {
      // Extract profile image URL
      let profileImageUrl = null
      if (user.profileImage) {
        const imageUrl =
          user.profileImage.url ||
          (user.profileImage.data && user.profileImage.data.attributes && user.profileImage.data.attributes.url)
        if (imageUrl) {
          // Don't prepend the API URL here, we'll do it in the component
          profileImageUrl = imageUrl
        }
      }

      // Create thumbnail URL if available
      let thumbnailUrl = undefined
      if (user.profileImage?.formats?.thumbnail?.url) {
        // Don't prepend the API URL here, we'll do it in the component
        thumbnailUrl = user.profileImage.formats.thumbnail.url
      }

      return {
        id: user.id,
        documentId: user.documentId || `user-${user.id}`,
        username: user.username,
        displayName: user.displayName || user.username,
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
    if (isAuthenticated) {
      try {
        // Get the token from cookies
        const cookies = document.cookie.split(";")
        const authCookie = cookies.find(
          (cookie) => cookie.trim().startsWith("jwt=") || cookie.trim().startsWith("authToken="),
        )
        const userToken = authCookie ? authCookie.split("=")[1] : null

        if (userToken) {
          const meResponse = await fetch(`${apiUrl}/api/users/me?populate=following`, {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            cache: "no-store",
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
        }
      } catch (error) {
        console.error("Client: Error fetching current user following:", error)
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
    console.error("Client: Error in getFollowers:", error)
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
 * Get users that a user is following with optimized data fetching (client-side)
 */
export async function getFollowing(username: string, page = 1, pageSize = 10): Promise<NetworkListResponse> {
  try {
    const apiUrl = getApiUrl()
    const token = getApiToken()

    // Check if user is authenticated (for client-side)
    const isAuthenticated =
      typeof document !== "undefined" && (document.cookie.includes("jwt=") || document.cookie.includes("authToken="))

    if (!token) {
      console.error("Client: No API token found for fetching following")
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

    console.log(`Client: Fetching user with optimized following query: ${apiUrl}/api/users?${queryString}`)

    const response = await fetch(`${apiUrl}/api/users?${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const userData = await response.json()
    console.log("Client: User data with following:", userData)

    // Extract the user from the response
    const user = userData[0] || (userData.data && userData.data[0])
    if (!user) {
      console.error(`Client: User not found: ${username}`)
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

    // Filter out unpublished following and get unique following users
    const publishedFollowing = following.filter((follow: any) => follow.publishedAt !== null)

    // Extract following users from the relationship
    const followingUsers: NetworkUser[] = []
    const processedIds = new Set()

    // For client-side, we'll use a simpler approach to avoid too many requests
    // We'll extract what information we can from the follower relationships
    for (const follow of publishedFollowing) {
      if (follow.id && !processedIds.has(follow.id)) {
        processedIds.add(follow.id)

        // Use a placeholder for now - in a real implementation, you'd want to
        // fetch the actual follower details in a batch
        followingUsers.push({
          id: follow.id,
          documentId: follow.documentId || `follow-${follow.id}`,
          username: `user-${follow.id}`,
          displayName: `User ${follow.id}`,
          profileImage: {
            url: "/abstract-user-icon.png",
          },
          isFollowing: false,
        })
      }
    }

    // If we have a token, make a batch request to get the actual user details
    if (token && followingUsers.length > 0) {
      try {
        const followingIds = followingUsers.map((user) => user.id)

        const batchQuery = qs.stringify(
          {
            filters: {
              id: {
                $in: followingIds,
              },
            },
            populate: ["profileImage"],
          },
          {
            encodeValuesOnly: true,
          },
        )

        const batchResponse = await fetch(`${apiUrl}/api/users?${batchQuery}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })

        if (batchResponse.ok) {
          const batchData = await batchResponse.json()
          const users = batchData.data || batchData

          // Update our placeholder users with real data
          for (const user of users) {
            const userData = user.attributes || user
            const existingUserIndex = followingUsers.findIndex((u) => u.id === user.id)

            if (existingUserIndex >= 0) {
              // Extract profile image URL
              let profileImageUrl = "/abstract-user-icon.png"
              if (userData.profileImage) {
                const imageUrl =
                  userData.profileImage.url ||
                  (userData.profileImage.data &&
                    userData.profileImage.data.attributes &&
                    userData.profileImage.data.attributes.url)
                if (imageUrl) {
                  profileImageUrl = ensureAbsoluteUrl(imageUrl, apiUrl)
                }
              }

              // Create thumbnail URL if available
              let thumbnailUrl = undefined
              if (userData.profileImage?.formats?.thumbnail?.url) {
                thumbnailUrl = ensureAbsoluteUrl(userData.profileImage.formats.thumbnail.url, apiUrl)
              }

              followingUsers[existingUserIndex] = {
                id: user.id,
                documentId: userData.documentId || `user-${user.id}`,
                username: userData.username,
                displayName: userData.displayName || userData.username,
                profileImage: {
                  url: profileImageUrl,
                  formats: thumbnailUrl
                    ? {
                        thumbnail: { url: thumbnailUrl },
                      }
                    : undefined,
                },
                isFollowing: followingUsers[existingUserIndex].isFollowing,
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching batch user data:", error)
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
    console.error("Client: Error in getFollowing:", error)
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
 * Toggle follow status for a user (client-side)
 */
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
    console.error("Client: Error toggling follow status:", error)
    return {
      success: false,
      isFollowing: currentlyFollowing,
      message: "Failed to update follow status",
    }
  }
}
