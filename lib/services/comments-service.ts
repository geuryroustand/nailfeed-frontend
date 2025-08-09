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
      return proxyRequestWithRetry(endpoint, options, { retries: retries - 1, retryDelay })
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
  threadOf?: { id: number; content?: string; author?: { id: string; name: string; avatar?: string } } | null
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

export class CommentsService {
  static async getComments(
    postId: string | number,
    documentId?: string,
    page = 1,
    pageSize = 5,
  ): Promise<CommentsResponse> {
    try {
      if (!postId && !documentId) {
        return { data: [], pagination: { page: 1, pageSize, pageCount: 1, total: 0 } }
      }

      const base = buildBaseEndpoint(postId, documentId)
      const endpoint = `${base}?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`

      const response = await proxyRequestWithRetry(endpoint, { method: "GET" }, { retries: 2, retryDelay: 500 })

      if (response.status === 404) {
        return { data: [], pagination: { page: 1, pageSize, pageCount: 1, total: 0 } }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error("Error fetching comments:", errorText || `HTTP ${response.status}`)
        return { data: [], pagination: { page: 1, pageSize, pageCount: 1, total: 0 } }
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
        pagination: { page, pageSize, pageCount: 1, total: Array.isArray(responseData) ? responseData.length : 1 },
      }
    } catch (error) {
      console.error("Error in getComments:", error instanceof Error ? error.message : error)
      return { data: [], pagination: { page: 1, pageSize, pageCount: 1, total: 0 } }
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

      const response = await proxyRequest(endpoint, { method: "POST", data: body })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error("Error adding comment:", errorText || `HTTP ${response.status}`)
        return { success: false, error: errorText || `HTTP ${response.status}` }
      }

      return await response.json()
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" }
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

      const res = await proxyRequest(endpoint, { method: "PUT", data: { content } })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        return { success: false, error: errorData.error?.message || `HTTP ${res.status}`, details: errorData }
      }
      return await res.json()
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" }
    }
  }

  static async deleteComment(
    postId: string | number,
    documentId: string | undefined,
    commentId: number,
    authorId: string | number,
  ) {
    try {
      if (!commentId) throw new Error("No commentId provided to deleteComment")
      const base = buildBaseEndpoint(postId, documentId)
      const numericAuthorId =
        typeof authorId === "string" && /^\d+$/.test(authorId) ? Number.parseInt(authorId, 10) : authorId
      const endpoint = `${base}/comment/${commentId}?authorId=${numericAuthorId}`

      const response = await proxyRequest(endpoint, { method: "DELETE" })

      if (response.status === 404) {
        return { success: false, error: `Comment with ID ${commentId} not found` }
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        let errorData: any
        try {
          errorData = text ? JSON.parse(text) : { error: { message: `HTTP error: ${response.status}` } }
        } catch {
          errorData = { error: { message: text || `HTTP error: ${response.status} ${response.statusText}` } }
        }
        return { success: false, error: errorData.error?.message || `Failed to delete`, details: errorData }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" }
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

      const response = await proxyRequest(endpoint, { method: "POST", data: { reason, content } })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: errorData.error?.message || `HTTP ${response.status}`, details: errorData }
      }
      return { success: true, data: await response.json() }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" }
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
