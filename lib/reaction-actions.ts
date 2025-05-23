"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import qs from "qs"

// Base URL for API requests
const API_BASE_URL = process.env.API_URL || "https://nailfeed-backend-production.up.railway.app"
const API_TOKEN = process.env.API_TOKEN

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = cookies()
  const jwt = cookieStore.get("jwt")?.value

  const headers: HeadersInit = {
    ...options.headers,
    "Content-Type": "application/json",
  }

  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`
  } else if (API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_TOKEN}`
  }

  console.log(`Server Action: Fetching ${options.method || "GET"} ${url}`)
  if (options.body) {
    console.log(`Server Action: Request body:`, options.body)
  }

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  })
}

export async function reactToPost(postId: number | string, userId: number | string, type: string) {
  try {
    console.log(`Server Action: Adding reaction ${type} to post ${postId} by user ${userId}`)

    // First check if user already has a reaction for this post
    const query = {
      filters: {
        post: {
          id: {
            $eq: postId,
          },
        },
        user: {
          id: {
            $eq: userId,
          },
        },
      },
    }

    const queryString = qs.stringify(query, { encodeValuesOnly: true })
    const checkUrl = `${API_BASE_URL}/api/likes?${queryString}`

    console.log(`Server Action: Checking existing reactions with URL: ${checkUrl}`)
    const checkResponse = await fetchWithAuth(checkUrl)

    if (!checkResponse.ok) {
      console.error(`Server Action: Failed to check existing reactions: ${checkResponse.status}`)
      console.error(`Server Action: Response:`, await checkResponse.text())
      throw new Error(`Failed to check existing reactions: ${checkResponse.status}`)
    }

    const checkData = await checkResponse.json()
    console.log(`Server Action: Check response:`, checkData)

    if (checkData.data && checkData.data.length > 0) {
      // User already has a reaction
      const existingReaction = checkData.data[0]
      console.log(`Server Action: Found existing reaction:`, existingReaction)

      // If same reaction type, remove it (toggle off)
      if (existingReaction.attributes.type === type) {
        console.log(`Server Action: Removing existing reaction with same type`)
        const deleteUrl = `${API_BASE_URL}/api/likes/${existingReaction.id}`
        const deleteResponse = await fetchWithAuth(deleteUrl, { method: "DELETE" })

        if (!deleteResponse.ok) {
          console.error(`Server Action: Failed to remove reaction: ${deleteResponse.status}`)
          console.error(`Server Action: Response:`, await deleteResponse.text())
          throw new Error(`Failed to remove reaction: ${deleteResponse.status}`)
        }

        console.log(`Server Action: Successfully removed reaction`)
      } else {
        // Update to new reaction type
        console.log(`Server Action: Updating reaction to new type: ${type}`)
        const updateUrl = `${API_BASE_URL}/api/likes/${existingReaction.id}`
        const updateBody = JSON.stringify({
          data: {
            type,
          },
        })

        const updateResponse = await fetchWithAuth(updateUrl, {
          method: "PUT",
          body: updateBody,
        })

        if (!updateResponse.ok) {
          console.error(`Server Action: Failed to update reaction: ${updateResponse.status}`)
          console.error(`Server Action: Response:`, await updateResponse.text())
          throw new Error(`Failed to update reaction: ${updateResponse.status}`)
        }

        console.log(`Server Action: Successfully updated reaction`)
      }
    } else {
      // Create new reaction
      console.log(`Server Action: Creating new reaction`)

      // Format the data according to Strapi v5 requirements
      const createBody = JSON.stringify({
        data: {
          type,
          post: postId,
          user: userId,
          publishedAt: new Date().toISOString(),
        },
      })

      const createUrl = `${API_BASE_URL}/api/likes`
      const createResponse = await fetchWithAuth(createUrl, {
        method: "POST",
        body: createBody,
      })

      if (!createResponse.ok) {
        console.error(`Server Action: Failed to create reaction: ${createResponse.status}`)
        console.error(`Server Action: Response:`, await createResponse.text())
        throw new Error(`Failed to create reaction: ${createResponse.status}`)
      }

      console.log(`Server Action: Successfully created reaction`)
    }

    // Revalidate paths that might display this post
    revalidatePath("/")
    revalidatePath("/post/[id]", "page")
    revalidatePath("/profile")
    revalidatePath("/explore")

    return {
      success: true,
      postId,
      userId,
      type,
    }
  } catch (error) {
    console.error(`Server Action: Error reacting to post ${postId}:`, error)
    return {
      success: false,
      message: "Failed to add reaction",
      error: error.message,
    }
  }
}

export async function getPostReactions(postId: number | string) {
  try {
    console.log(`Server Action: Getting reactions for post ${postId}`)

    // Build query to get all reactions for this post with user information
    const query = {
      filters: {
        post: {
          id: {
            $eq: postId,
          },
        },
      },
      populate: {
        user: {
          fields: ["id", "username", "displayName"],
        },
      },
    }

    const queryString = qs.stringify(query, { encodeValuesOnly: true })
    const url = `${API_BASE_URL}/api/likes?${queryString}`

    console.log(`Server Action: Fetching reactions with URL: ${url}`)
    const response = await fetchWithAuth(url)

    if (!response.ok) {
      console.error(`Server Action: Failed to get reactions: ${response.status}`)
      console.error(`Server Action: Response:`, await response.text())
      throw new Error(`Failed to get reactions: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Server Action: Reactions response:`, data)

    // Process reactions by type with user information
    const reactionsByType = {
      like: { users: [], count: 0 },
      love: { users: [], count: 0 },
      haha: { users: [], count: 0 },
      wow: { users: [], count: 0 },
      sad: { users: [], count: 0 },
      angry: { users: [], count: 0 },
    }

    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((reaction) => {
        const type = reaction.attributes.type
        if (reactionsByType[type] !== undefined) {
          reactionsByType[type].count++

          // Add user information if available
          if (reaction.attributes.user && reaction.attributes.user.data) {
            const userData = reaction.attributes.user.data
            reactionsByType[type].users.push({
              id: userData.id,
              username: userData.attributes.username,
              displayName: userData.attributes.displayName || userData.attributes.username,
              avatar: userData.attributes.avatar?.data?.attributes?.url || null,
            })
          }
        }
      })
    }

    console.log(`Server Action: Processed reactions by type:`, reactionsByType)
    return {
      success: true,
      reactions: reactionsByType,
      rawData: data, // Include raw data for debugging
    }
  } catch (error) {
    console.error(`Server Action: Error getting reactions for post ${postId}:`, error)
    return {
      success: false,
      message: "Failed to get reactions",
      error: error.message,
    }
  }
}

export async function getUserReaction(postId: number | string, userId: number | string) {
  try {
    console.log(`Server Action: Getting user ${userId} reaction for post ${postId}`)

    // Build query to find user's reaction for this post
    const query = {
      filters: {
        post: {
          id: {
            $eq: postId,
          },
        },
        user: {
          id: {
            $eq: userId,
          },
        },
      },
    }

    const queryString = qs.stringify(query, { encodeValuesOnly: true })
    const url = `${API_BASE_URL}/api/likes?${queryString}`

    console.log(`Server Action: Fetching user reaction with URL: ${url}`)
    const response = await fetchWithAuth(url)

    if (!response.ok) {
      console.error(`Server Action: Failed to get user reaction: ${response.status}`)
      console.error(`Server Action: Response:`, await response.text())
      throw new Error(`Failed to get user reaction: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Server Action: User reaction response:`, data)

    // Check if user has reacted
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const reaction = data.data[0]
      return {
        success: true,
        reaction: {
          id: reaction.id,
          type: reaction.attributes.type,
        },
      }
    }

    return {
      success: true,
      reaction: null,
    }
  } catch (error) {
    console.error(`Server Action: Error getting user reaction for post ${postId}:`, error)
    return {
      success: false,
      message: "Failed to get user reaction",
      error: error.message,
    }
  }
}
