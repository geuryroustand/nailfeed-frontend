// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN

// Define a type for the retry options
type FetchRetryOptions = {
  retries?: number
  retryDelay?: number
}

// Define a function to retry a fetch request
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: FetchRetryOptions = {},
): Promise<Response> {
  const { retries = 3, retryDelay = 1000 } = retryOptions

  try {
    const response = await fetch(url, options)
    if (!response.ok && response.status !== 404) {
      // Only retry if the status is not 404 (Not Found)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return fetchWithRetry(url, options, { ...retryOptions, retries: retries - 1 })
    }
    throw error
  }
}

// Define comment type for better type safety
export interface CommentAuthor {
  id: string
  name: string
  email?: string
  avatar?: string
}

export interface Comment {
  id: number
  content: string
  author: {
    id: string
    name: string
    email?: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
  children?: Comment[]
  blocked?: boolean
  blockedThread?: boolean
  threadOf?: {
    id: number
    content?: string
    author?: {
      id: string
      name: string
      avatar?: string
    }
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

export class CommentsService {
  /**
   * Get comments for a post using the Strapi v5 pagination
   */
  static async getComments(
    postId: string | number,
    documentId?: string,
    page = 1,
    pageSize = 5,
  ): Promise<CommentsResponse> {
    // Log the request parameters for debugging
    console.log(`CommentsService.getComments called with:`, {
      postId,
      documentId,
      page,
      pageSize,
      apiBaseUrl: API_BASE_URL,
    })
    try {
      // Check if we have a valid postId or documentId
      if (!postId && !documentId) {
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      // Use documentId if available, otherwise use numeric ID
      const identifier = documentId || postId

      // Format the content type according to Strapi Comments plugin requirements
      const contentType = "api::post.post"

      // Build the URL with pagination parameters
      const endpoint = `/api/comments/${contentType}:${identifier}`
      const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
        endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
      }?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`

      console.log(`Fetching comments from URL: ${url} (page ${page}, pageSize ${pageSize})`)

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (API_TOKEN) {
        headers["Authorization"] = `Bearer ${API_TOKEN}`
      }

      // Make the request with retry logic
      let response
      try {
        response = await fetchWithRetry(
          url,
          {
            method: "GET",
            headers,
            cache: "no-store",
          },
          { retries: 2, retryDelay: 500 },
        )
      } catch (fetchError) {
        console.error("Fetch error in getComments:", fetchError)
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      // If we get a 404, return empty data instead of throwing
      if (response.status === 404) {
        console.log("Comments endpoint returned 404, returning empty data")
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: errorText }
        }
        console.error("Error fetching comments:", errorData)
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      // Parse the response
      const responseData = await response.json()
      console.log("Comments response data:", responseData)

      // Handle different response formats from Strapi v5
      if (responseData.data && responseData.meta && responseData.meta.pagination) {
        // Strapi v5 format with meta.pagination
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
        // Direct array response
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
        // Already in our expected format
        return responseData as CommentsResponse
      }

      // Fallback: treat the response as the data
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
      console.error("Error in getComments:", error)
      // Return empty array to avoid UI errors
      return {
        data: [],
        pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
      }
    }
  }

  /**
   * Recursively counts all comments including nested replies
   */
  static countTotalComments(comments: Comment[] | undefined): number {
    if (!comments || !Array.isArray(comments)) {
      return 0
    }

    let count = 0

    for (const comment of comments) {
      if (!comment) continue // Skip null or undefined comments

      // Count the comment itself
      count++

      // Count its children recursively
      if (comment.children && Array.isArray(comment.children)) {
        count += this.countTotalComments(comment.children)
      }
    }

    console.log(`Counted ${count} comments from array of length ${comments.length}`)
    return count
  }

  /**
   * Add a new comment to a post
   */
  static async addComment(postId: string | number, documentId: string | undefined, content: string, threadOf?: number) {
    try {
      // Check if we have a valid postId or documentId
      if (!postId && !documentId) {
        throw new Error("No postId or documentId provided to addComment")
      }

      // Use documentId if available, otherwise use numeric ID
      const identifier = documentId || postId

      // Format the content type according to Strapi Comments plugin requirements
      const contentType = "api::post.post"

      // Construct the endpoint URL
      const endpoint = `/api/comments/${contentType}:${identifier}`
      const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
        endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
      }`

      console.log("Adding comment to URL:", url)

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (API_TOKEN) {
        headers["Authorization"] = `Bearer ${API_TOKEN}`
      }

      // Get the JWT from cookies if it exists (client-side)
      const jwt = this.getJwtFromCookie()
      if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`
      }

      // Prepare request body
      const body: any = { content }

      // Add threadOf if provided
      if (threadOf) {
        body.threadOf = threadOf
      }

      console.log("Comment request body:", body)

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: errorText }
        }

        console.error("Error adding comment:", errorData)
        return {
          success: false,
          error: errorData.error?.message || `Failed to add comment: ${response.status} ${response.statusText}`,
          details: errorData,
        }
      }

      return await response.json()
    } catch (error) {
      console.error("Error in addComment:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  /**
   * Update an existing comment
   * @param postId - The ID of the post
   * @param documentId - The document ID of the post
   * @param commentId - The ID of the comment to update
   * @param content - The updated comment content
   * @returns The updated comment or error information
   */
  static async updateComment(
    postId: string | number,
    documentId: string | undefined,
    commentId: number,
    content: string,
  ) {
    try {
      // Check if we have a valid commentId
      if (!commentId) {
        throw new Error("No commentId provided to updateComment")
      }

      // Use documentId if available, otherwise use numeric ID
      const identifier = documentId || postId

      // Format the content type according to Strapi Comments plugin requirements
      const contentType = "api::post.post"

      const endpoint = `/api/comments/${contentType}:${identifier}/comment/${commentId}`
      const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
        endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
      }`

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (API_TOKEN) {
        headers["Authorization"] = `Bearer ${API_TOKEN}`
      }

      // Get the JWT from cookies if it exists (client-side)
      const jwt = this.getJwtFromCookie()
      if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`
      }

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error?.message || `Failed to update comment: ${response.status} ${response.statusText}`,
          details: errorData,
        }
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  /**
   * Delete a comment
   * @param postId - The ID of the post
   * @param documentId - The document ID of the post
   * @param commentId - The ID of the comment to delete
   * @param authorId - The ID of the comment author
   * @returns Success status and any error information
   */
  static async deleteComment(
    postId: string | number,
    documentId: string | undefined,
    commentId: number,
    authorId: string | number,
  ) {
    try {
      // Check if we have a valid commentId
      if (!commentId) {
        throw new Error("No commentId provided to deleteComment")
      }

      // Use documentId if available, otherwise use numeric ID
      const identifier = documentId || postId

      // Convert authorId to number if it's a string containing only digits
      const numericAuthorId =
        typeof authorId === "string" && /^\d+$/.test(authorId) ? Number.parseInt(authorId, 10) : authorId

      // Format the content type according to Strapi Comments plugin requirements
      const contentType = "api::post.post"

      // Construct the URL exactly as provided in the example
      const endpoint = `/api/comments/${contentType}:${identifier}/comment/${commentId}?authorId=${numericAuthorId}`
      const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
        endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
      }`

      // Prepare headers with authorization
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Get the JWT from cookies if it exists (client-side)
      const jwt = this.getJwtFromCookie()
      if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`
      } else if (API_TOKEN) {
        headers["Authorization"] = `Bearer ${API_TOKEN}`
      }

      // Make the DELETE request
      const response = await fetch(url, {
        method: "DELETE",
        headers,
      })

      // If we get a 404, return success: false with a message
      if (response.status === 404) {
        return {
          success: false,
          error: `Comment with ID ${commentId} not found`,
        }
      }

      // Get the response text for detailed error information
      const responseText = await response.text()

      if (!response.ok) {
        // Try to parse the response as JSON if possible
        let errorData
        try {
          errorData = responseText ? JSON.parse(responseText) : { error: { message: `HTTP error: ${response.status}` } }
        } catch (e) {
          errorData = { error: { message: responseText || `HTTP error: ${response.status} ${response.statusText}` } }
        }

        return {
          success: false,
          error: errorData.error?.message || `Failed to delete comment: ${response.status} ${response.statusText}`,
          details: errorData,
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  /**
   * Report a comment for abuse
   */
  static async reportCommentAbuse(
    postId: string | number,
    documentId: string | undefined,
    commentId: number,
    reason: string,
    content: string,
  ) {
    try {
      // Check if we have a valid commentId
      if (!commentId) {
        throw new Error("No commentId provided to reportCommentAbuse")
      }

      // Use documentId if available, otherwise use numeric ID
      const identifier = documentId || postId

      // Format the content type according to Strapi Comments plugin requirements
      const contentType = "api::post.post"

      const endpoint = `/api/comments/${contentType}:${identifier}/comment/${commentId}/report-abuse`
      const url = `${API_BASE_URL}${API_BASE_URL.endsWith("/") ? "" : "/"}${
        endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
      }`

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (API_TOKEN) {
        headers["Authorization"] = `Bearer ${API_TOKEN}`
      }

      // Get the JWT from cookies if it exists (client-side)
      const jwt = this.getJwtFromCookie()
      if (jwt) {
        headers["Authorization"] = `Bearer ${jwt}`
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason, content }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error?.message || `Failed to report comment: ${response.status} ${response.statusText}`,
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

  /**
   * Helper method to get JWT from cookie
   */
  private static getJwtFromCookie(): string | undefined {
    // For client-side
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.startsWith("jwt=")) {
          return cookie.substring(4)
        }
      }
    }

    return undefined
  }
}
export const commentsService = new CommentsService()
