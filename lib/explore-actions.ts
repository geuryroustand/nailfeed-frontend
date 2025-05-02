"use server"

import { revalidatePath } from "next/cache"
import { getExplorePosts, getUserInteractions } from "./explore-data"

// Like a post
export async function likePost(postId: number) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // In a real app, this would update the database
    console.log(`Liked post ${postId}`)

    // Revalidate the explore page
    revalidatePath("/explore")

    return { success: true }
  } catch (error) {
    console.error("Error liking post:", error)
    return { success: false, error: "Failed to like post" }
  }
}

// Unlike a post
export async function unlikePost(postId: number) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // In a real app, this would update the database
    console.log(`Unliked post ${postId}`)

    // Revalidate the explore page
    revalidatePath("/explore")

    return { success: true }
  } catch (error) {
    console.error("Error unliking post:", error)
    return { success: false, error: "Failed to unlike post" }
  }
}

// Save a post
export async function savePost(postId: number) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // In a real app, this would update the database
    console.log(`Saved post ${postId}`)

    // Revalidate the explore page
    revalidatePath("/explore")

    return { success: true }
  } catch (error) {
    console.error("Error saving post:", error)
    return { success: false, error: "Failed to save post" }
  }
}

// Unsave a post
export async function unsavePost(postId: number) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // In a real app, this would update the database
    console.log(`Unsaved post ${postId}`)

    // Revalidate the explore page
    revalidatePath("/explore")

    return { success: true }
  } catch (error) {
    console.error("Error unsaving post:", error)
    return { success: false, error: "Failed to unsave post" }
  }
}

// Add a comment to a post
export async function addComment(postId: number, comment: string) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // In a real app, this would update the database
    console.log(`Added comment to post ${postId}: ${comment}`)

    // Generate a fake comment object
    const newComment = {
      id: Math.floor(Math.random() * 1000),
      postId,
      username: "currentuser",
      userImage: "/diverse-professional-profiles.png",
      text: comment,
      createdAt: new Date().toISOString(),
    }

    // Revalidate the explore page
    revalidatePath("/explore")

    return { success: true, comment: newComment }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

// Fetch more posts (for infinite scroll)
export async function fetchMorePosts(cursor: string | null) {
  try {
    // Fetch more posts from the data layer
    const postsResponse = await getExplorePosts(12, cursor)

    // Get user interactions for these posts
    const userInteractions = await getUserInteractions("current-user")

    // Combine posts with user interaction data
    const postsWithInteractions = postsResponse.data.map((post) => ({
      ...post,
      isLiked: userInteractions.likedPostIds.includes(post.id),
      isSaved: userInteractions.savedPostIds.includes(post.id),
    }))

    return {
      success: true,
      posts: postsWithInteractions,
      nextCursor: postsResponse.nextCursor,
      hasMore: postsResponse.hasMore,
    }
  } catch (error) {
    console.error("Error fetching more posts:", error)
    return { success: false, error: "Failed to fetch more posts" }
  }
}
