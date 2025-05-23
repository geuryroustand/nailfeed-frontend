"use server"

import { revalidatePath } from "next/cache"

// Comment out the fetch operations in fetchMorePosts
export async function fetchMorePosts(cursor: number) {
  console.log(`MOCK: Fetching more posts with cursor ${cursor}`)

  // Comment out the actual getPosts call
  /*
  const { posts, nextCursor, hasMore } = await getPosts(5, cursor);
  */

  // Create mock posts data
  const posts = Array.from({ length: 5 }).map((_, i) => ({
    id: cursor + i + 1,
    image: `/placeholder.svg?height=400&width=400&query=nail+art+${cursor + i + 1}`,
    likes: Math.floor(Math.random() * 500),
    comments: Math.floor(Math.random() * 50),
    featured: Math.random() > 0.7,
    title: `Post ${cursor + i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))

  const nextCursor = cursor + 5
  const hasMore = nextCursor < 50 // Limit to 50 mock posts

  return { posts, nextCursor, hasMore }
}

// Comment out the fetch operations in refreshPosts
export async function refreshPosts() {
  // Force revalidation of all post-related pages
  revalidatePath("/")
  revalidatePath("/profile")
  revalidatePath("/explore")

  console.log("MOCK: Refreshing posts")

  // Comment out the actual getPosts call
  /*
  // Return fresh posts
  return await getPosts(10, 0);
  */

  // Create mock posts data
  const posts = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    image: `/placeholder.svg?height=400&width=400&query=nail+art+${i + 1}`,
    likes: Math.floor(Math.random() * 500),
    comments: Math.floor(Math.random() * 50),
    featured: Math.random() > 0.7,
    title: `Post ${i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))

  const nextCursor = 10
  const hasMore = true

  return { posts, nextCursor, hasMore }
}

// Comment out the fetch operations in likePost
export async function likePost(postId: number) {
  try {
    console.log(`MOCK: Liking post ${postId}`)

    // Comment out the actual fetch request
    /*
    // In a real app, this would update a database
    console.log(`Liking post ${postId}`);

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300));
    */

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

// Comment out the fetch operations in addComment
export async function addComment(postId: number, comment: string) {
  try {
    console.log(`MOCK: Adding comment to post ${postId}: ${comment}`)

    // Comment out the actual fetch request
    /*
    // In a real app, this would update a database
    console.log(`Adding comment to post ${postId}: ${comment}`);

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300));
    */

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

// Comment out the fetch operations in reactToComment
export async function reactToComment(postId: number, commentId: number, reactionType: string) {
  try {
    console.log(`MOCK: Adding reaction ${reactionType} to comment ${commentId} on post ${postId}`)

    // Comment out the actual fetch request
    /*
    // In a real app, this would update a database
    console.log(`Adding reaction ${reactionType} to comment ${commentId} on post ${postId}`);

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300));
    */

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
