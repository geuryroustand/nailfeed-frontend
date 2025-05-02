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

// Add these new functions after the existing functions in the file

export async function reactToPost(postId: number, userId: string, reactionType: string) {
  try {
    // In a real app, this would update a database
    console.log(`Adding reaction ${reactionType} to post ${postId} by user ${userId}`)

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return success response
    const result = {
      success: true,
      postId,
      reactionType,
      newReactionCount: Math.floor(Math.random() * 100) + 1, // Simulate updated count
    }

    // Revalidate the homepage to reflect the changes
    revalidatePath("/")
    revalidatePath(`/post/${postId}`)

    return result
  } catch (error) {
    console.error("Error reacting to post:", error)
    return {
      success: false,
      postId,
      message: "Failed to add reaction",
    }
  }
}

export async function getPostReactionCounts(postId: number) {
  try {
    // In a real app, this would query a database
    console.log(`Getting reaction counts for post ${postId}`)

    // Simulate a database query
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Return simulated reaction counts
    return {
      like: Math.floor(Math.random() * 50) + 10,
      love: Math.floor(Math.random() * 30) + 5,
      haha: Math.floor(Math.random() * 20) + 3,
      wow: Math.floor(Math.random() * 15) + 2,
      sad: Math.floor(Math.random() * 10) + 1,
      angry: Math.floor(Math.random() * 5),
    }
  } catch (error) {
    console.error("Error getting post reaction counts:", error)
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

export async function getUserReactionToPost(postId: number, userId: string) {
  try {
    // In a real app, this would query a database
    console.log(`Checking if user ${userId} has reacted to post ${postId}`)

    // Simulate a database query
    await new Promise((resolve) => setTimeout(resolve, 150))

    // Randomly return a reaction type or null to simulate user's reaction status
    const reactions = [null, "like", "love", "haha", "wow", "sad", "angry"]
    const randomIndex = Math.floor(Math.random() * reactions.length)

    return {
      success: true,
      reactionType: reactions[randomIndex],
    }
  } catch (error) {
    console.error("Error checking user reaction:", error)
    return {
      success: false,
      message: "Failed to check user reaction",
    }
  }
}
