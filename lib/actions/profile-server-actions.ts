"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import qs from "qs"
import type { UserProfileResponse } from "@/lib/services/user-service"
import { getApiUrl } from "@/lib/api-helpers"
import { processUserForProfile, processPostsForGallery } from "@/lib/post-data-processors"

/**
 * Fetches a user profile with optimized data loading
 * @param username The username to fetch
 * @returns The user profile data
 */
export async function fetchProfileData(username: string) {
  try {
    console.log(`[Server Action] Fetching profile data for: ${username}`)

    // Get authentication token
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      console.error("[Server Action] No authentication token found")
      return { error: "Authentication required" }
    }

    const apiUrl = getApiUrl()

    // Use query string to optimize data fetching - get exactly what we need in one request
    const query = qs.stringify(
      {
        filters: {
          username: {
            $eq: username,
          },
        },
        populate: {
          profileImage: true,
          coverImage: true,
          posts: {
            sort: ["publishedAt:desc"],
            populate: {
              mediaItems: {
                populate: ["file"],
              },
              user: {
                populate: ["profileImage"],
              },
            },
          },
          followers: {
            populate: ["follower"],
          },
          following: {
            populate: ["following"],
          },
        },
      },
      { encodeValuesOnly: true },
    )

    // Make the API request
    const response = await fetch(`${apiUrl}/api/users?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 60, // Cache for 1 minute
        tags: [`profile-${username}`], // Tag for targeted revalidation
      },
    })

    if (!response.ok) {
      console.error(`[Server Action] API error: ${response.status}`)
      return { error: `Failed to fetch profile: ${response.statusText}` }
    }

    const data = await response.json()

    // Process the response data
    const userData = Array.isArray(data) ? data[0] : data.data && Array.isArray(data.data) ? data.data[0] : null

    if (!userData) {
      return { notFound: true }
    }

    // Process user data for optimized rendering
    const processedUser = processUserForProfile(userData)

    // Process posts for gallery display
    const processedPosts = processPostsForGallery(userData.posts || [])

    // Transform to expected format
    const transformedUser: UserProfileResponse = {
      ...processedUser,
      id: userData.id,
      username: userData.username,
      profileImage: userData.profileImage,
      coverImage: userData.coverImage,
      posts: processedPosts,
      followers: processFollowersData(userData.followers),
      following: processFollowingData(userData.following),
    }

    return { user: transformedUser }
  } catch (error) {
    console.error("[Server Action] Error fetching profile:", error)
    return { error: "Failed to fetch profile data" }
  }
}

/**
 * Checks if the current user is following another user
 * @param targetUsername The username to check follow status for
 * @returns Whether the current user is following the target user
 */
export async function checkFollowStatus(targetUsername: string) {
  try {
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      return { isFollowing: false }
    }

    const apiUrl = getApiUrl()

    // First get the target user's ID
    const userResponse = await fetch(
      `${apiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(targetUsername)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      },
    )

    if (!userResponse.ok) {
      return { isFollowing: false }
    }

    const userData = await userResponse.json()
    const targetUser = Array.isArray(userData)
      ? userData[0]
      : userData.data && Array.isArray(userData.data)
        ? userData.data[0]
        : null

    if (!targetUser) {
      return { isFollowing: false }
    }

    const targetUserId = targetUser.id

    // Now check if the current user is following the target user
    const followQuery = qs.stringify(
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
                  $eq: targetUserId,
                },
              },
            },
          ],
        },
      },
      { encodeValuesOnly: true },
    )

    const followResponse = await fetch(`${apiUrl}/api/follows?${followQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    })

    if (!followResponse.ok) {
      return { isFollowing: false }
    }

    const followData = await followResponse.json()
    const isFollowing = !!(followData.data?.length > 0 || followData.length > 0)

    return { isFollowing }
  } catch (error) {
    console.error("[Server Action] Error checking follow status:", error)
    return { isFollowing: false }
  }
}

/**
 * Toggles the follow status for a user
 * @param username The username to follow/unfollow
 * @param currentlyFollowing Whether the user is currently being followed
 * @returns The result of the follow/unfollow operation
 */
export async function toggleFollowServer(username: string, currentlyFollowing: boolean) {
  try {
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "Authentication required",
      }
    }

    const apiUrl = getApiUrl()

    // Get the user ID
    const userResponse = await fetch(`${apiUrl}/api/users?filters[username][$eq]=${encodeURIComponent(username)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!userResponse.ok) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "Failed to find user",
      }
    }

    const userData = await userResponse.json()
    const userId = userData.data?.[0]?.id || userData[0]?.id

    if (!userId) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "User not found",
      }
    }

    // Check current follow status
    const followQuery = qs.stringify(
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

    const followCheckResponse = await fetch(`${apiUrl}/api/follows?${followQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const followCheckData = await followCheckResponse.json()
    const existingFollow = followCheckData.data?.length > 0 || followCheckData.length > 0

    // If the current state doesn't match the database state, sync them
    if (currentlyFollowing !== existingFollow) {
      currentlyFollowing = existingFollow
    }

    if (currentlyFollowing) {
      // Unfollow: Find the follow relationship and delete it
      const followId = followCheckData.data?.[0]?.id || followCheckData[0]?.id

      if (!followId) {
        return {
          success: true,
          isFollowing: false,
          message: "User already unfollowed",
        }
      }

      // Delete the follow relationship
      const unfollowResponse = await fetch(`${apiUrl}/api/follows/${followId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!unfollowResponse.ok) {
        return {
          success: false,
          isFollowing: currentlyFollowing,
          message: "Failed to unfollow user",
        }
      }
    } else {
      // Follow: Create a new follow relationship
      const followResponse = await fetch(`${apiUrl}/api/follows`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            following: userId,
          },
        }),
      })

      if (!followResponse.ok) {
        return {
          success: false,
          isFollowing: currentlyFollowing,
          message: "Failed to follow user",
        }
      }
    }

    // Get updated follower count
    const updatedUserResponse = await fetch(`${apiUrl}/api/users/${userId}?populate=followers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const updatedUserData = await updatedUserResponse.json()
    const followers = updatedUserData.data?.attributes?.followers?.data || updatedUserData.followers || []
    const newFollowerCount = Array.isArray(followers) ? followers.length : 0

    // Revalidate paths
    revalidatePath(`/profile/${username}`)
    revalidatePath(`/profile`)

    return {
      success: true,
      isFollowing: !currentlyFollowing,
      newFollowerCount,
    }
  } catch (error) {
    console.error("[Server Action] Error toggling follow status:", error)
    return {
      success: false,
      isFollowing: currentlyFollowing,
      message: "An error occurred",
    }
  }
}

// Helper functions to process data
function processFollowersData(followers: any[] = []) {
  if (!Array.isArray(followers)) return []

  return followers
    .map((item) => {
      const followerData = item.follower || {}

      return {
        id: followerData.id || item.id,
        username: followerData.username || "",
        displayName: followerData.displayName || followerData.username || "",
        profileImage: followerData.profileImage || null,
      }
    })
    .filter((follower) => follower.username)
}

function processFollowingData(following: any[] = []) {
  if (!Array.isArray(following)) return []

  return following
    .map((item) => {
      const followingData = item.following || {}

      return {
        id: followingData.id || item.id,
        username: followingData.username || "",
        displayName: followingData.displayName || followingData.username || "",
        profileImage: followingData.profileImage || null,
      }
    })
    .filter((follow) => follow.username)
}
