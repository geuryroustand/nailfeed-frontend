"use server"

import { cache } from "react"
import { fetchPostWithRelated } from "@/lib/actions/post-fetch-actions"
import { revalidatePath } from "next/cache"
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
      console.log(`Server Action: Fetching post ${idOrDocumentId} with related posts`)
      return await fetchPostWithRelated(idOrDocumentId)
    } catch (error) {
      console.error(`Error in getPostWithRelated for ${idOrDocumentId}:`, error)
      return { post: null, relatedPosts: [] }
    }
  },
)

// Server action to track post view
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
      }),
    })
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
  } catch (error) {
    console.error(`Error revalidating post ${postId}:`, error)
  }
}
