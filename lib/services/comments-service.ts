// All comment API calls are routed through a server proxy to ensure proper Authorization
// without exposing secrets to the client.

const PROXY_URL = "/api/auth-proxy"

type FetchRetryOptions = {
  retries?: number
  retryDelay?: number
}

async function proxyRequest(
  endpoint: string,
  {
    method = "GET",
    data,
  }: {
    method?: string
    data?: any
  } = {},
): Promise<Response> {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ endpoint, method, data }),
  })
  return res
}

async function proxyRequestWithRetry(
  endpoint: string,
  options: { method?: string; data?: any } = {},
  retryOptions: FetchRetryOptions = {},
): Promise<Response> {
  const { retries = 2, retryDelay = 500 } = retryOptions
  try {
    const response = await proxyRequest(endpoint, options)
    // Let 404s pass through to caller to map to empty results
    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, retryDelay))
      return proxyRequestWithRetry(endpoint, options, {
        retries: retries - 1,
        retryDelay,
      })
    }
    throw error
  }
}

export interface CommentAuthor {
  id: string
  name: string
  email?: string
  avatar?: string
}

export interface Comment {
  id: number
  content: string
  author: { id: string; name: string; email?: string; avatar?: string }
  createdAt: string
  updatedAt: string
  children?: Comment[]
  blocked?: boolean
  blockedThread?: boolean
  threadOf?: {
    id: number
    content?: string
    author?: { id: string; name: string; avatar?: string }
  } | null
}

export interface PaginationInfo {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export interface CommentsResponse {
  data: Comment[]
  pagination: PaginationInfo
}

const buildBaseEndpoint = (postId: string | number, documentId?: string) => {
  const identifier = documentId || postId
  const contentType = "api::post.post"
  return `/api/comments/${contentType}:${identifier}`
}

import { createCommentNotification, createReplyNotification } from "@/lib/actions/notification-actions"

export class CommentsService {
  static async getComments(
    postId: string | number,
    documentId?: string,
    page = 1,
    pageSize = 5,
  ): Promise<CommentsResponse> {
    try {
      if (!postId && !documentId) {
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      const base = buildBaseEndpoint(postId, documentId)
      const endpoint = `${base}?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`

      const response = await proxyRequestWithRetry(endpoint, { method: "GET" }, { retries: 2, retryDelay: 500 })

      if (response.status === 404) {
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error("Error fetching comments:", errorText || `HTTP ${response.status}`)
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      const responseData = await response.json().catch(() => ({}) as any)

      if (responseData.data && responseData.meta?.pagination) {
        return {
          data: responseData.data,
          pagination: {
            page: responseData.meta.pagination.page,
            pageSize: responseData.meta.pagination.pageSize,
            pageCount: responseData.meta.pagination.pageCount,
            total: responseData.meta.pagination.total,
          },
        }
      } else if (Array.isArray(responseData)) {
        return {
          data: responseData,
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(responseData.length / pageSize),
            total: responseData.length,
          },
        }
      } else if (responseData.data && responseData.pagination) {
        return responseData as CommentsResponse
      }

      return {
        data: Array.isArray(responseData) ? responseData : [responseData],
        pagination: {
          page,
          pageSize,
          pageCount: 1,
          total: Array.isArray(responseData) ? responseData.length : 1,
        },
      }
    } catch (error) {
      console.error("Error in getComments:", error instanceof Error ? error.message : error)
      return {
        data: [],
        pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
      }
    }
  }

  static countTotalComments(comments: Comment[] | undefined): number {
    if (!comments || !Array.isArray(comments)) return 0
    let count = 0
    for (const c of comments) {
      if (!c) continue
      count++
      if (c.children && Array.isArray(c.children)) count += this.countTotalComments(c.children)
    }
    return count
  }

  static async addComment(postId: string | number, documentId: string | undefined, content: string, threadOf?: number) {
    try {
      if (!postId && !documentId) throw new Error("No postId or documentId provided to addComment")

      const base = buildBaseEndpoint(postId, documentId)
      const endpoint = base

      const body: Record<string, any> = { content }
      if (threadOf) body.threadOf = threadOf

      const response = await proxyRequest(endpoint, {
        method: "POST",
        data: body,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error("Error adding comment:", errorText || `HTTP ${response.status}`)
        return {
          success: false,
          error: errorText || `HTTP ${response.status}`,
        }
      }

      const result = await response.json()

      try {
        // Get the comment data from the response
        const commentData = result.data || result
        const commentAuthor = commentData.author

        if (commentAuthor && commentAuthor.id) {
          console.log("[v0] Comment created successfully, triggering notifications:", {
            postId: documentId || postId,
            threadOf,
            commentAuthorId: commentAuthor.id,
            commentAuthorName: commentAuthor.name,
          })

          if (threadOf) {
            // This is a reply to an existing comment
            console.log("[v0] Creating reply notification for comment:", threadOf)

            // We need to get the parent comment author ID
            // For now, we'll need to fetch the parent comment to get its author
            // This could be optimized by including parent comment data in the response
            try {
              const parentComments = await this.getComments(postId, documentId?.toString(), 1, 100)
              const findParentComment = (comments: Comment[], targetId: number): Comment | null => {
                for (const comment of comments) {
                  if (comment.id === targetId) return comment
                  if (comment.children) {
                    const found = findParentComment(comment.children, targetId)
                    if (found) return found
                  }
                }
                return null
              }

              const parentComment = findParentComment(parentComments.data, threadOf)
              if (parentComment && parentComment.author.id !== commentAuthor.id) {
                await createReplyNotification(
                  (documentId || postId).toString(),
                  threadOf.toString(),
                  parentComment.author.id, // Comment author who should receive notification
                  commentAuthor.id,
                  commentAuthor.name || "Someone",
                  content,
                )
                console.log("[v0] Reply notification created successfully")
              } else {
                console.log("[v0] Skipping reply notification - replying to own comment or parent not found")
              }
            } catch (parentError) {
              console.error("[v0] Error fetching parent comment for reply notification:", parentError)
            }
          } else {
            // This is a new comment on the post
            console.log("[v0] Creating comment notification for post:", documentId || postId)

            // We need to get the post author ID
            // The notification function will handle fetching the post author
            await createCommentNotification(
              (documentId || postId).toString(),
              "", // Post author ID will be fetched in the notification function
              commentAuthor.id,
              commentAuthor.name || "Someone",
              content,
            )
            console.log("[v0] Comment notification created successfully")
          }
        } else {
          console.log("[v0] No comment author data available for notifications")
        }
      } catch (notificationError) {
        // Don't fail the comment creation if notification fails
        console.error("[v0] Error creating comment notification:", notificationError)
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  static async updateComment(
    postId: string | number,
    documentId: string | undefined,
    commentId: number,
    content: string,
  ) {
    try {
      if (!commentId) throw new Error("No commentId provided to updateComment")

      const base = buildBaseEndpoint(postId, documentId)
      const endpoint = `${base}/comment/${commentId}`

      const res = await proxyRequest(endpoint, {
        method: "PUT",
        data: { content },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${res.status}`,
          details: errorData,
        }
      }
      return await res.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  static async deleteComment(
    postId: string | number,
    documentId: string | undefined,
    commentId: number | string, // Accept both number and string for backward compatibility
    authorId: string | number,
  ) {
    try {
      if (!commentId) throw new Error("No commentId provided to deleteComment")

      const base = buildBaseEndpoint(postId, documentId)
      const numericAuthorId =
        typeof authorId === "string" && /^\d+$/.test(authorId) ? Number.parseInt(authorId, 10) : authorId

      // The endpoint should be: /api/comments/api::content-type:id/comment/commentId?authorId=authorId
      const endpoint = `${base}/comment/${commentId}?authorId=${numericAuthorId}`

      console.log("[v0] Attempting to delete comment:", {
        postId: documentId || postId,
        commentId,
        authorId: numericAuthorId,
        endpoint,
        baseEndpoint: base,
      })

      const response = await proxyRequest(endpoint, { method: "DELETE" })

      console.log("[v0] Delete comment response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      })

      if (response.status === 404) {
        console.error("[v0] Comment not found for deletion:", {
          commentId,
          endpoint,
          authorId: numericAuthorId,
        })
        return {
          success: false,
          error: `Comment with ID ${commentId} not found. It may have already been deleted.`,
        }
      }

      if (response.status === 403) {
        console.error("[v0] Forbidden - user not authorized to delete comment:", {
          commentId,
          endpoint,
          authorId: numericAuthorId,
        })
        return {
          success: false,
          error: "You are not authorized to delete this comment. You can only delete your own comments.",
        }
      }

      if (response.status === 409) {
        console.error("[v0] Conflict - comment deletion conflict:", {
          commentId,
          endpoint,
          authorId: numericAuthorId,
        })
        return {
          success: false,
          error: "Unable to delete comment due to a conflict. Please try again.",
        }
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        console.error("[v0] Delete comment failed:", {
          status: response.status,
          statusText: response.statusText,
          responseText: text,
        })

        let errorData: any
        try {
          errorData = text ? JSON.parse(text) : { error: { message: `HTTP error: ${response.status}` } }
        } catch {
          errorData = {
            error: {
              message: text || `HTTP error: ${response.status} ${response.statusText}`,
            },
          }
        }
        return {
          success: false,
          error: errorData.error?.message || `Failed to delete comment (${response.status})`,
          details: errorData,
        }
      }

      console.log("[v0] Comment deleted successfully:", commentId)
      return { success: true }
    } catch (error) {
      console.error("[v0] Error in deleteComment:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  static async reportCommentAbuse(
    postId: string | number,
    documentId: string | undefined,
    commentId: number,
    reason: string,
    content: string,
  ) {
    try {
      if (!commentId) throw new Error("No commentId provided to reportCommentAbuse")
      const base = buildBaseEndpoint(postId, documentId)
      const endpoint = `${base}/comment/${commentId}/report-abuse`

      const response = await proxyRequest(endpoint, {
        method: "POST",
        data: { reason, content },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
          details: errorData,
        }
      }
      return { success: true, data: await response.json() }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  private static getJwtFromCookie(): string | undefined {
    // Kept for backward compatibility if needed elsewhere,
    // but proxy already prefers JWT from cookies when present.
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.startsWith("jwt=")) return cookie.substring(4)
        if (cookie.startsWith("authToken=")) return cookie.substring("authToken=".length)
      }
    }
    return undefined
  }
}
export const commentsService = new CommentsService()
