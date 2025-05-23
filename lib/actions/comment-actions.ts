"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

/**
 * Fetch comments for a post
 */
export async function fetchComments(postId: string | number, documentId?: string, page = 1, pageSize = 6) {
  try {
    // Use documentId if available, otherwise use numeric ID
    const identifier = documentId || postId
    const endpoint = `/api/comments/api::post.post:${identifier}/flat?pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token exists
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`
    }

    // Get the JWT from cookies if it exists (server-side)
    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching comments:", error)
    return { data: [], pagination: { page, pageSize, total: 0, pageCount: 0 } }
  }
}

/**
 * Add a new comment to a post
 */
export async function addComment(
  postId: string | number,
  documentId: string | undefined,
  content: string,
  threadOf?: number,
  author?: { id: string; name: string; email: string; avatar?: string },
) {
  try {
    // Use documentId if available, otherwise use numeric ID
    const identifier = documentId
    const endpoint = `/api/comments/api::post.post:${identifier}`
    const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token exists
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`
    }

    // Get the JWT from cookies if it exists (server-side)
    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    }

    // Prepare request body
    const body: any = { content }

    // Add threadOf if provided
    if (threadOf) {
      body.threadOf = threadOf
    }

    // Add author if provided (for non-authenticated users)
    if (author) {
      body.author = author
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `Failed to add comment: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Revalidate both the post page and the feed page
    revalidatePath(`/post/${postId}`)
    revalidatePath("/")
    revalidatePath("/explore")

    return { success: true, data }
  } catch (error) {
    console.error("Error adding comment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  postId: string | number,
  documentId: string | undefined,
  commentId: number,
  authorId?: string,
) {
  try {
    // Use documentId if available, otherwise use numeric ID
    const identifier = documentId || postId
    let endpoint = `/api/comments/api::post.post:${identifier}/comment/${commentId}`

    // Add authorId as query param if provided
    if (authorId) {
      endpoint += `?authorId=${authorId}`
    }

    const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token exists
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`
    }

    // Get the JWT from cookies if it exists (server-side)
    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `Failed to delete comment: ${response.status} ${response.statusText}`)
    }

    // Revalidate both the post page and the feed page
    revalidatePath(`/post/${postId}`)
    revalidatePath("/")
    revalidatePath("/explore")

    return { success: true }
  } catch (error) {
    console.error("Error deleting comment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Report a comment for abuse
 */
export async function reportCommentAbuse(
  postId: string | number,
  documentId: string | undefined,
  commentId: number,
  reason: string,
  content: string,
) {
  try {
    // Use documentId if available, otherwise use numeric ID
    const identifier = documentId || postId
    const endpoint = `/api/comments/api::post.post:${identifier}/comment/${commentId}/report-abuse`
    const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token exists
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`
    }

    // Get the JWT from cookies if it exists (server-side)
    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason, content }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `Failed to report comment: ${response.status} ${response.statusText}`)
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error("Error reporting comment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
