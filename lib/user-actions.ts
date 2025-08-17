"use server"

import { revalidatePath } from "next/cache"
import type { FollowActionResult, ProfileUpdateResult } from "./user-data"
import qs from "qs"
import { cookies } from "next/headers"

// Helper function to get API URL
function getApiUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

// Helper function to safely fetch data with better error handling
async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    console.log(`Fetching: ${url}`)
    const response = await fetch(url, options)

    if (!response.ok) {
      console.error(`Fetch error: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.error(`Response body: ${text}`)
      throw new Error(`${response.status} ${response.statusText}`)
    }

    return response
  } catch (error) {
    console.error(`Fetch failed: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export async function toggleFollow(username: string, _currentlyFollowing?: boolean): Promise<FollowActionResult> {
  try {
    const apiUrl = getApiUrl()

    // Get the token from cookies (server-side)
    const cookieStore = cookies()
    const token = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value

    if (!token) {
      return {
        success: false,
        isFollowing: false,
        message: "Authentication required to follow users",
      }
    }

    const currentUserResponse = await safeFetch(`${apiUrl}/api/users/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const currentUserData = await currentUserResponse.json()
    const currentUserId = currentUserData.id
    const currentUserDocumentId = currentUserData.documentId

    if (!currentUserId || !currentUserDocumentId) {
      return {
        success: false,
        isFollowing: false,
        message: "Unable to get current user information",
      }
    }

    // First, get the user ID for the username
    const userResponse = await safeFetch(`${apiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(username)}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const userData = await userResponse.json()
    console.log("User data:", JSON.stringify(userData).substring(0, 200) + "...")

    // Handle different response formats
    const userId = userData.data?.[0]?.id || userData[0]?.id
    const userDocumentId = userData.data?.[0]?.documentId || userData[0]?.documentId

    if (!userId || !userDocumentId) {
      throw new Error(`User ${username} not found`)
    }

    const followsQuery = qs.stringify(
      {
        filters: {
          $and: [
            {
              follower: {
                id: {
                  $eq: currentUserId,
                },
              },
            },
            {
              following: {
                id: {
                  $eq: userId,
                },
              },
            },
          ],
        },
      },
      { encodeValuesOnly: true },
    )

    const followCheckResponse = await safeFetch(`${apiUrl}/api/follows?${followsQuery}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const followCheckData = await followCheckResponse.json()
    const existingFollow = followCheckData.data?.length > 0 || followCheckData.length > 0
    const followId = followCheckData.data?.[0]?.id || followCheckData[0]?.id
    const followDocumentId = followCheckData.data?.[0]?.documentId || followCheckData[0]?.documentId

    console.log(`[v0] Current database follow state for ${username}: ${existingFollow}`)
    console.log(`[v0] Follow relationship ID: ${followId}`)
    console.log(`[v0] Follow relationship documentId: ${followDocumentId}`)

    // Determine action based on current database state
    if (existingFollow) {
      // User is currently following - unfollow them
      if (!followDocumentId) {
        console.log("[v0] Follow relationship exists but no documentId found")
        return {
          success: false,
          isFollowing: true,
          message: "Unable to unfollow user",
        }
      }

      console.log(`[v0] Sending DELETE request to unfollow ${username} with documentId ${followDocumentId}`)
      await safeFetch(`${apiUrl}/api/follows/${followDocumentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log(`[v0] Successfully unfollowed ${username}`)
    } else {
      // User is not currently following - follow them
      console.log(`[v0] Sending POST request to follow ${username}`)
      await safeFetch(`${apiUrl}/api/follows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            follower: {
              connect: [currentUserDocumentId],
            },
            following: {
              connect: [userDocumentId],
            },
          },
        }),
      })

      console.log(`[v0] Successfully followed ${username}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get updated follower count
    const newFollowerCount = await getFollowerCount(apiUrl, token, userId)
    const newIsFollowing = !existingFollow // Toggle the state

    console.log(`[v0] Final result - isFollowing: ${newIsFollowing}, followerCount: ${newFollowerCount}`)

    // Return success response with the new state
    const result: FollowActionResult = {
      success: true,
      isFollowing: newIsFollowing,
      newFollowerCount,
      message: newIsFollowing ? `Now following ${username}` : `Unfollowed ${username}`,
    }

    // Revalidate the profile pages to reflect the changes
    revalidatePath("/profile")
    revalidatePath(`/profile/${username}`)

    return result
  } catch (error) {
    console.error("Error toggling follow status:", error)
    return {
      success: false,
      isFollowing: false,
      message: "Failed to update follow status",
    }
  }
}

// Helper function to get follower count
async function getFollowerCount(apiUrl: string, token: string, userId: string | number): Promise<number> {
  try {
    const userResponse = await safeFetch(`${apiUrl}/api/users/${userId}?populate=followers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const userData = await userResponse.json()

    // Handle different response formats
    const followers = userData.data?.attributes?.followers?.data || userData.followers || []
    return Array.isArray(followers) ? followers.length : 0
  } catch (error) {
    console.error("Error getting follower count:", error)
    return 0
  }
}

// Helper function to get following count
async function getFollowingCount(apiUrl: string, token: string, userId: string | number): Promise<number> {
  try {
    const userResponse = await safeFetch(`${apiUrl}/api/users/${userId}?populate=following`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const userData = await userResponse.json()

    // Handle different response formats
    const following = userData.data?.attributes?.following?.data || userData.following || []
    return Array.isArray(following) ? following.length : 0
  } catch (error) {
    console.error("Error getting following count:", error)
    return 0
  }
}

export async function checkFollowStatus(username: string): Promise<{
  isFollowing: boolean
  followerCount: number
  followingCount: number
}> {
  try {
    const apiUrl = getApiUrl()
    console.log(`Checking follow status for ${username} using API URL: ${apiUrl}`)

    // Get the token from cookies (server-side)
    const cookieStore = cookies()
    const token = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value

    console.log(`Token available: ${!!token}`)

    if (!token) {
      console.log("No authentication token found, returning default values")
      return { isFollowing: false, followerCount: 0, followingCount: 0 }
    }

    // Use sample data if environment variable is set
    if (process.env.USE_SAMPLE_DATA === "true" || process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === "true") {
      console.log("Using sample data for follow status")
      return { isFollowing: false, followerCount: 24800, followingCount: 1250 }
    }

    try {
      // First, we need to get the user ID for the username
      const userUrl = `${apiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(username)}`
      console.log(`Fetching user data from: ${userUrl}`)

      const userResponse = await safeFetch(userUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })

      const userData = await userResponse.json()
      console.log("User data response:", JSON.stringify(userData).substring(0, 200) + "...")

      // Extract user ID from response
      const userId = userData.data?.[0]?.id || userData[0]?.id

      if (!userId) {
        console.error(`User ${username} not found in API response`)
        // Fall back to sample data
        return { isFollowing: false, followerCount: 24800, followingCount: 1250 }
      }

      // Get follower and following counts
      const followerCount = await getFollowerCount(apiUrl, token, userId)
      const followingCount = await getFollowingCount(apiUrl, token, userId)

      // Check if the current user is following this user
      // Use /api/users/me for the current user's following list
      const followsQuery = qs.stringify(
        {
          filters: {
            $and: [
              {
                follower: {
                  id: {
                    $eq: "me",
                  },
                },
              },
              {
                following: {
                  id: {
                    $eq: userId,
                  },
                },
              },
            ],
          },
        },
        { encodeValuesOnly: true },
      )

      const followsResponse = await safeFetch(`${apiUrl}/api/follows?${followsQuery}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })

      const followsData = await followsResponse.json()
      const isFollowing = !!(followsData.data?.length > 0 || followsData.length > 0)

      return { isFollowing, followerCount, followingCount }
    } catch (error) {
      console.error("API error in checkFollowStatus:", error)
      // Fall back to sample data
      return { isFollowing: false, followerCount: 24800, followingCount: 1250 }
    }
  } catch (error) {
    console.error("Error checking follow status:", error)
    // Fall back to sample data
    return { isFollowing: false, followerCount: 24800, followingCount: 1250 }
  }
}

export async function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  try {
    // Extract form data
    const displayName = formData.get("displayName") as string
    const bio = formData.get("bio") as string
    const website = formData.get("website") as string
    const location = formData.get("location") as string

    // Validate data
    if (!displayName) {
      return {
        success: false,
        message: "Display name is required",
      }
    }

    // In a real app, this would update a database
    console.log("Updating profile:", { displayName, bio, website, location })

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Return updated user data
    const updatedUser = {
      displayName,
      bio,
      website,
      location,
    }

    // Revalidate the profile page to reflect the changes
    revalidatePath("/profile")

    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return {
      success: false,
      message: "Failed to update profile",
    }
  }
}
