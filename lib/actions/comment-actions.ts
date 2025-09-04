"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { sendNotificationToUser, getPostAuthor } from "@/lib/services/web-push-service"

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
    console.log("[v0] Adding comment:", {
      postId,
      documentId,
      content: content.substring(0, 50),
      threadOf,
      authorId: author?.id,
    })

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

    const body: any = { content }
    if (threadOf) body.threadOf = threadOf
    if (author) body.author = author

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
    console.log("[v0] Comment created successfully:", data.data?.id)

    try {
      if (threadOf) {
        // This is a reply - notify the parent comment author
        console.log("[v0] Processing reply notification for threadOf:", threadOf)

        // Get parent comment details to find the comment author
        const parentCommentResponse = await fetch(`${API_BASE_URL}/api/comments/${threadOf}?populate=*`, {
          headers: {
            Authorization: `Bearer ${SERVER_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        })

        if (parentCommentResponse.ok) {
          const parentCommentData = await parentCommentResponse.json()
          const commentAuthorId = parentCommentData.data?.author?.id
          const replyAuthorId = author?.id
          const replyAuthorName = author?.name

          console.log("[v0] Parent comment data:", { commentAuthorId, replyAuthorId, replyAuthorName })

          if (commentAuthorId && replyAuthorId && replyAuthorName && commentAuthorId !== replyAuthorId) {
            console.log("[v0] Sending reply notification to comment author:", commentAuthorId)

            const notificationPayload = {
              title: `New reply from ${replyAuthorName} 💅`,
              body: `${replyAuthorName} replied 💬 to your comment: "${content.length > 80 ? content.substring(0, 80) + "..." : content}"`,
              url: `/post/${documentId || postId}`,
              icon: "/icon-192x192.png",
              badge: "/icon-192x192.png",
            }

            sendNotificationToUser(commentAuthorId.toString(), notificationPayload).catch((error) => {
              console.error("[v0] Failed to send reply push notification:", error)
            })
          } else {
            console.log("[v0] Skipping reply notification - same user or missing data")
          }
        } else {
          console.error("[v0] Failed to fetch parent comment:", parentCommentResponse.status)
        }
      } else {
        // This is a direct comment on post - notify the post author
        console.log("[v0] Processing comment notification for post:", postId)

        const postAuthor = await getPostAuthor(documentId || postId)
        const commentAuthorId = author?.id
        const commentAuthorName = author?.name

        console.log("[v0] Post author data:", {
          postAuthorId: postAuthor?.id,
          commentAuthorId,
          commentAuthorName,
        })

        if (postAuthor && commentAuthorId && commentAuthorName && postAuthor.id !== commentAuthorId) {
          console.log("[v0] Sending comment notification to post author:", postAuthor.id)

          const notificationPayload = {
            title: `New comment from ${commentAuthorName} 💅`,
            body: `${commentAuthorName} commented 💬 on your post: "${content.length > 80 ? content.substring(0, 80) + "..." : content}"`,
            url: `/post/${documentId || postId}`,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
          }

          sendNotificationToUser(postAuthor.id, notificationPayload).catch((error) => {
            console.error("[v0] Failed to send comment push notification:", error)
          })
        } else if (postAuthor?.id === commentAuthorId) {
          console.log("[v0] Skipping self-notification for user", commentAuthorId)
        } else {
          console.log("[v0] Could not find post author for post", documentId || postId)
        }
      }
    } catch (notificationError) {
      // Log but don't fail the comment creation
      console.error("[v0] Error sending notification:", notificationError)
    }

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
