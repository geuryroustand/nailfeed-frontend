"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getCurrentUser } from "@/app/actions/auth-actions"

// Server-only base URL and token
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
const SERVER_API_TOKEN = process.env.API_TOKEN || ""

/**
 * Fetch comments for a post
 */
export async function fetchComments(postId: string | number, documentId?: string, page = 1, pageSize = 6) {
  try {
    const identifier = documentId || postId
    const endpoint = `/api/comments/api::post.post:${identifier}/flat?pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
      endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
    }`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    } else if (SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
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
    const identifier = documentId
    const endpoint = `/api/comments/api::post.post:${identifier}`
    const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
      endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
    }`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    } else if (SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
    }

    let authorData = author
    if (!authorData) {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          authorData = {
            id: currentUser.id.toString(),
            name: currentUser.displayName || currentUser.username || "Anonymous",
            email: currentUser.email,
            avatar: currentUser.profileImage?.url || currentUser.profileImage?.formats?.thumbnail?.url,
          }
        }
      } catch (error) {
        console.error("Error getting current user for comment:", error)
      }
    }

    const body: any = { content }
    if (threadOf) body.threadOf = threadOf

    if (authorData) {
      body.author = authorData
    }

    console.log("[v0] Submitting comment with payload:", JSON.stringify(body, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Comment submission failed:", errorData)
      throw new Error(errorData.error?.message || `Failed to add comment: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Comment submitted successfully:", data)
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
    const identifier = documentId || postId
    let endpoint = `/api/comments/api::post.post:${identifier}/comment/${commentId}`
    if (authorId) endpoint += `?authorId=${authorId}`

    const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
      endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
    }`
    const headers: HeadersInit = { "Content-Type": "application/json" }

    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    } else if (SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
    }

    const response = await fetch(url, { method: "DELETE", headers })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `Failed to delete comment: ${response.status} ${response.statusText}`)
    }

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
    const identifier = documentId || postId
    const endpoint = `/api/comments/api::post.post:${identifier}/comment/${commentId}/report-abuse`
    const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
      endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
    }`

    const headers: HeadersInit = { "Content-Type": "application/json" }

    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    } else if (SERVER_API_TOKEN) {
      headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
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
