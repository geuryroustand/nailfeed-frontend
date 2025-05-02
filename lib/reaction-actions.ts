"use server"

import { revalidatePath } from "next/cache"

export async function reactToPost(postId: number | string, userId: number | string, type: string) {
  try {
    console.log(`Adding reaction ${type} to post ${postId} by user ${userId}`)

    // In a real app, this would update a database
    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300))

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
    console.error(`Error reacting to post ${postId}:`, error)
    return {
      success: false,
      message: "Failed to add reaction",
    }
  }
}

export async function getPostReactions(postId: number | string) {
  try {
    console.log(`Getting reactions for post ${postId}`)

    // In a real app, this would query a database
    // Simulate a database query
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return mock reaction data
    const mockReactions = {
      like: Math.floor(Math.random() * 50),
      love: Math.floor(Math.random() * 30),
      haha: Math.floor(Math.random() * 20),
      wow: Math.floor(Math.random() * 15),
      sad: Math.floor(Math.random() * 10),
      angry: Math.floor(Math.random() * 5),
    }

    return {
      success: true,
      reactions: mockReactions,
    }
  } catch (error) {
    console.error(`Error getting reactions for post ${postId}:`, error)
    return {
      success: false,
      message: "Failed to get reactions",
    }
  }
}

export async function getUserReaction(postId: number | string, userId: number | string) {
  try {
    console.log(`Getting user ${userId} reaction for post ${postId}`)

    // In a real app, this would query a database
    // Simulate a database query
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return mock user reaction (randomly decide if user has reacted)
    const hasReacted = Math.random() > 0.5

    if (hasReacted) {
      const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"]
      const randomType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)]

      return {
        success: true,
        reaction: {
          id: `reaction-${Date.now()}`,
          type: randomType,
        },
      }
    }

    return {
      success: true,
      reaction: null,
    }
  } catch (error) {
    console.error(`Error getting user reaction for post ${postId}:`, error)
    return {
      success: false,
      message: "Failed to get user reaction",
    }
  }
}
