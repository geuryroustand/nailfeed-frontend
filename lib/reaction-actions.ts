"use server"

import { revalidatePath } from "next/cache"
import { apiClient } from "@/lib/api-client"

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry"

interface ReactionResponse {
  success: boolean
  message?: string
  reaction?: any
  postId?: number | string
  reactionType?: ReactionType
  likesCount?: number
}

/**
 * Add a reaction to a post
 */
export async function addReaction(
  postId: number | string,
  userId: number | string,
  reactionType: ReactionType = "like",
): Promise<ReactionResponse> {
  try {
    console.log(`Adding ${reactionType} reaction to post ${postId} by user ${userId}`)

    // First check if the user already has a reaction on this post
    const existingReaction = await getUserReactionOnPost(userId, postId)

    if (existingReaction) {
      // If the user is adding the same reaction type, remove it (toggle off)
      if (existingReaction.type === reactionType) {
        return await removeReaction(existingReaction.id)
      }
      // Otherwise, update the existing reaction to the new type
      else {
        return await updateReaction(existingReaction.id, reactionType)
      }
    }

    // Create a new reaction
    const response = await apiClient.post("/api/likes", {
      data: {
        type: reactionType,
        post: {
          connect: [postId.toString()],
        },
        user: {
          connect: [userId.toString()],
        },
      },
    })

    if (!response || !response.data) {
      throw new Error("Invalid API response when adding reaction")
    }

    // Update the post's likesCount
    await updatePostLikesCount(postId)

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/post/[id]")
    revalidatePath("/profile")
    revalidatePath("/explore")

    return {
      success: true,
      reaction: response.data,
      postId,
      reactionType,
    }
  } catch (error) {
    console.error("Error adding reaction:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add reaction",
    }
  }
}

/**
 * Update an existing reaction
 */
export async function updateReaction(
  reactionId: number | string,
  newReactionType: ReactionType,
): Promise<ReactionResponse> {
  try {
    console.log(`Updating reaction ${reactionId} to ${newReactionType}`)

    const response = await apiClient.put(`/api/likes/${reactionId}`, {
      data: {
        type: newReactionType,
      },
    })

    if (!response || !response.data) {
      throw new Error("Invalid API response when updating reaction")
    }

    // Get the post ID from the response to update its counts
    const postId = response.data.post?.id || response.data.post
    if (postId) {
      await updatePostLikesCount(postId)
    }

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/post/[id]")
    revalidatePath("/profile")
    revalidatePath("/explore")

    return {
      success: true,
      reaction: response.data,
      postId,
      reactionType: newReactionType,
    }
  } catch (error) {
    console.error("Error updating reaction:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update reaction",
    }
  }
}

/**
 * Remove a reaction
 */
export async function removeReaction(reactionId: number | string): Promise<ReactionResponse> {
  try {
    console.log(`Removing reaction ${reactionId}`)

    // First get the reaction to know which post to update
    const reactionResponse = await apiClient.get(`/api/likes/${reactionId}?populate=post`)
    const postId = reactionResponse?.data?.post?.id || reactionResponse?.data?.post

    // Delete the reaction
    const response = await apiClient.delete(`/api/likes/${reactionId}`)

    if (!response) {
      throw new Error("Invalid API response when removing reaction")
    }

    // Update the post's likesCount if we have the postId
    if (postId) {
      await updatePostLikesCount(postId)
    }

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/post/[id]")
    revalidatePath("/profile")
    revalidatePath("/explore")

    return {
      success: true,
      postId,
    }
  } catch (error) {
    console.error("Error removing reaction:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove reaction",
    }
  }
}

/**
 * Get a user's reaction on a specific post
 */
export async function getUserReactionOnPost(userId: number | string, postId: number | string) {
  try {
    console.log(`Checking if user ${userId} has reacted to post ${postId}`)

    const response = await apiClient.get(`/api/likes?filters[user][id][$eq]=${userId}&filters[post][id][$eq]=${postId}`)

    if (!response || !response.data) {
      return null
    }

    // Return the first reaction if found
    return response.data.length > 0 ? response.data[0] : null
  } catch (error) {
    console.error("Error checking user reaction:", error)
    return null
  }
}

/**
 * Get all reactions for a post
 */
export async function getPostReactions(postId: number | string) {
  try {
    console.log(`Getting all reactions for post ${postId}`)

    const response = await apiClient.get(`/api/likes?filters[post][id][$eq]=${postId}&populate=user`)

    if (!response || !response.data) {
      return []
    }

    return response.data
  } catch (error) {
    console.error("Error getting post reactions:", error)
    return []
  }
}

/**
 * Update a post's likesCount based on actual reaction count
 */
async function updatePostLikesCount(postId: number | string) {
  try {
    // Get the current count of reactions for this post
    const reactions = await getPostReactions(postId)
    const likesCount = reactions.length

    // Update the post with the new count
    await apiClient.put(`/api/posts/${postId}`, {
      data: {
        likesCount,
      },
    })

    return likesCount
  } catch (error) {
    console.error("Error updating post likes count:", error)
    throw error
  }
}

/**
 * Get reaction counts by type for a post
 */
export async function getReactionCountsByType(postId: number | string) {
  try {
    const reactions = await getPostReactions(postId)

    // Initialize counts for all reaction types
    const counts: Record<ReactionType, number> = {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    }

    // Count each reaction type
    reactions.forEach((reaction) => {
      if (reaction.type && counts[reaction.type as ReactionType] !== undefined) {
        counts[reaction.type as ReactionType]++
      }
    })

    return counts
  } catch (error) {
    console.error("Error getting reaction counts by type:", error)
    return {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    }
  }
}
