"use server"

import { cache } from "react"
import { fetchPostWithRelated } from "@/lib/actions/post-fetch-actions"
import { revalidatePath, revalidateTag } from "next/cache"
import type { Post } from "@/lib/post-data"

// Enhanced server action to fetch post with related posts
export const getPostWithRelated = cache(
  async (
    idOrDocumentId: string | number,
  ): Promise<{
    post: Post | null
    relatedPosts: Post[]
  }> => {
    try {
      console.log(`[v0] Server Action: Fetching post ${idOrDocumentId} with related posts`)
      const result = await fetchPostWithRelated(idOrDocumentId)
      console.log(`[v0] Server Action: Fetch completed, post found: ${result.post ? "yes" : "no"}`)
      return result
    } catch (error) {
      console.error(`[v0] Error in getPostWithRelated for ${idOrDocumentId}:`, error)
      return { post: null, relatedPosts: [] }
    }
  },
)

// Server action to track post view with analytics
export async function trackPostView(postId: number | string): Promise<void> {
  try {
    console.log(`Server Action: Tracking view for post ${postId}`)

    // Skip tracking in development
    if (process.env.NODE_ENV === "development") {
      return
    }

    const apiUrl = process.env.API_URL || "https://nailfeed-backend-production.up.railway.app"
    const endpoint = `/api/analytics/view`
    const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN || ""}`,
      },
      body: JSON.stringify({
        postId,
        source: "web",
        timestamp: new Date().toISOString(),
      }),
    })

    // Revalidate analytics data
    revalidateTag(`analytics-${postId}`)
  } catch (error) {
    // Log error but don't propagate it
    console.error(`Error tracking view for post ${postId}:`, error)
  }
}

// Server action to revalidate post data
export async function revalidatePost(postId: string | number): Promise<void> {
  try {
    console.log(`Server Action: Revalidating post ${postId}`)
    revalidatePath(`/post/${postId}`)
    revalidateTag(`post-${postId}`)
  } catch (error) {
    console.error(`Error revalidating post ${postId}:`, error)
  }
}

// Server action to prefetch related posts
export async function prefetchRelatedPosts(postId: string | number): Promise<Post[]> {
  try {
    console.log(`Server Action: Prefetching related posts for ${postId}`)
    const { relatedPosts } = await fetchPostWithRelated(postId)
    return relatedPosts
  } catch (error) {
    console.error(`Error prefetching related posts for ${postId}:`, error)
    return []
  }
}
