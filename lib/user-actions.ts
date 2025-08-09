"use server"

import { revalidatePath } from "next/cache"
import type { FollowActionResult, ProfileUpdateResult } from "./user-data"
import qs from "qs"

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

export async function toggleFollow(username: string, currentlyFollowing: boolean): Promise<FollowActionResult> {
  try {
    const apiUrl = getApiUrl()

    // Get the token from cookies (client-side)
    let token = ""

    // In a client component, we need to get the token from document.cookie
    if (typeof window !== "undefined") {
      const cookies = document.cookie.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )
      token = cookies.jwt || cookies.authToken
    }

    if (!token) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "Authentication required to follow users",
      }
    }

    // First, we need to get the user ID for the username
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

    if (!userId) {
      throw new Error(`User ${username} not found`)
    }

    // Check if the follow relationship already exists to prevent duplicates
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

    const followCheckResponse = await safeFetch(`${apiUrl}/api/follows?${followsQuery}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const followCheckData = await followCheckResponse.json()
    const existingFollow = followCheckData.data?.length > 0 || followCheckData.length > 0

    // If the current state doesn't match the database state, sync them
    if (currentlyFollowing !== existingFollow) {
      console.log(
        `UI follow state (${currentlyFollowing}) doesn't match database state (${existingFollow}). Syncing...`,
      )
      currentlyFollowing = existingFollow
    }

    // Now handle follow/unfollow based on current status
    if (currentlyFollowing) {
      // Unfollow: Find the follow relationship and delete it
      const followId = followCheckData.data?.[0]?.id || followCheckData[0]?.id

      if (!followId) {
        console.log("Follow relationship not found, user might already be unfollowed")
        return {
          success: true,
          isFollowing: false,
          newFollowerCount: await getFollowerCount(apiUrl, token, userId),
          message: "User already unfollowed",
        }
      }

      // Delete the follow relationship
      await safeFetch(`${apiUrl}/api/follows/${followId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    } else {
      // Prevent duplicate follows
      if (existingFollow) {
        console.log("Follow relationship already exists, preventing duplicate")
        return {
          success: true,
          isFollowing: true,
          newFollowerCount: await getFollowerCount(apiUrl, token, userId),
          message: "Already following this user",
        }
      }

      // Follow: Create a new follow relationship
      await safeFetch(`${apiUrl}/api/follows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            following: userId,
            // No need to specify follower, Strapi will use the authenticated user
          },
        }),
      })
    }

    // Get updated follower count
    const newFollowerCount = await getFollowerCount(apiUrl, token, userId)

    // Return success response
    const result: FollowActionResult = {
      success: true,
      isFollowing: !currentlyFollowing,
      newFollowerCount,
    }

    // Revalidate the profile page to reflect the changes
    revalidatePath("/profile")
    revalidatePath(`/profile/${username}`) // Also revalidate the user's profile page if it exists

    return result
  } catch (error) {
    console.error("Error toggling follow status:", error)
    return {
      success: false,
      isFollowing: currentlyFollowing,
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
    const { cookies } = await import("next/headers")
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
