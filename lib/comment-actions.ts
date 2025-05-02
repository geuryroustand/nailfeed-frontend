"use server"

import { revalidatePath } from "next/cache"
import { updateTrendingReaction } from "./trending-reactions-data"

export async function reactToComment(postId: number, commentId: number, reactionType: string) {
  try {
    // In a real app, this would update a database
    console.log(`Adding reaction ${reactionType} to comment ${commentId} on post ${postId}`)

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Update trending reactions data
    const isAdding = true // In a real app, this would be determined by whether the user is adding or removing the reaction
    await updateTrendingReaction(reactionType, postId, isAdding)

    // Return success response
    const result = {
      success: true,
      postId,
      commentId,
      reactionType,
      newReactionCount: Math.floor(Math.random() * 10) + 1, // Simulate updated count
    }

    // Revalidate the homepage to reflect the changes
    revalidatePath("/")

    return result
  } catch (error) {
    console.error("Error reacting to comment:", error)
    return {
      success: false,
      postId,
      commentId,
      message: "Failed to add reaction",
    }
  }
}
