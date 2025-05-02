"use server"

import { revalidatePath } from "next/cache"
import { getPosts } from "@/lib/post-data"

export async function fetchMorePosts(cursor: number) {
  const { posts, nextCursor, hasMore } = await getPosts(5, cursor)
  return { posts, nextCursor, hasMore }
}

export async function refreshPosts() {
  // Force revalidation of all post-related pages
  revalidatePath("/")
  revalidatePath("/profile")
  revalidatePath("/explore")

  // Return fresh posts
  return await getPosts(10, 0)
}

export async function likePost(postId: number) {
  try {
    // In a real app, this would update a database
    console.log(`Liking post ${postId}`)

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return success response
    const result = {
      success: true,
      postId,
      newLikeCount: Math.floor(Math.random() * 100) + 200, // Simulate updated count
    }

    // Revalidate the homepage to reflect the changes
    revalidatePath("/")

    return result
  } catch (error) {
    console.error("Error liking post:", error)
    return {
      success: false,
      postId,
      message: "Failed to like post",
    }
  }
}

export async function addComment(postId: number, comment: string) {
  try {
    // In a real app, this would update a database
    console.log(`Adding comment to post ${postId}: ${comment}`)

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return success response with a new comment object
    const newComment = {
      id: Math.floor(Math.random() * 1000) + 100,
      username: "currentuser", // In a real app, this would be the current user
      text: comment,
      likes: 0,
    }

    // Revalidate the homepage to reflect the changes
    revalidatePath("/")

    return {
      success: true,
      postId,
      comment: newComment,
    }
  } catch (error) {
    console.error("Error adding comment:", error)
    return {
      success: false,
      postId,
      message: "Failed to add comment",
    }
  }
}

// Add this new function after the addComment function

export async function reactToComment(postId: number, commentId: number, reactionType: string) {
  try {
    // In a real app, this would update a database
    console.log(`Adding reaction ${reactionType} to comment ${commentId} on post ${postId}`)

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300))

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
