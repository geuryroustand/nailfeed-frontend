"use server"

import { revalidatePath } from "next/cache"

export async function likePostAction(postId: number, documentId: string, userId: string, reactionType: string) {
  try {
    console.log(`Server Action: Liking post ${postId} with reaction ${reactionType}`)

    // In a real implementation, this would interact with your database
    // For now, we'll just revalidate the paths

    revalidatePath("/")
    revalidatePath(`/post/${documentId}`)
    revalidatePath(`/post/${postId}`)

    return {
      success: true,
      message: "Reaction added successfully",
    }
  } catch (error) {
    console.error("Error in likePostAction:", error)
    return {
      success: false,
      message: "Failed to add reaction",
    }
  }
}

export async function unlikePostAction(postId: number, documentId: string, userId: string) {
  try {
    console.log(`Server Action: Unliking post ${postId}`)

    // In a real implementation, this would interact with your database
    // For now, we'll just revalidate the paths

    revalidatePath("/")
    revalidatePath(`/post/${documentId}`)
    revalidatePath(`/post/${postId}`)

    return {
      success: true,
      message: "Reaction removed successfully",
    }
  } catch (error) {
    console.error("Error in unlikePostAction:", error)
    return {
      success: false,
      message: "Failed to remove reaction",
    }
  }
}
