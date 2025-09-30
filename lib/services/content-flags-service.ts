"use client"

/**
 * Content Flags Service for reporting posts and comments
 * Follows Strapi v5 API patterns and Next.js 15 best practices
 */

const PROXY_URL = "/api/auth-proxy"

// Content flag interfaces
export interface ContentFlag {
  id: number
  documentId: string
  reason: ReportReason
  description?: string
  status: FlagStatus
  reporterEmail?: string
  createdAt: string
  updatedAt: string
  publishedAt: string
  reportedPost?: {
    id: number
    documentId: string
    title?: string
  }
  reportedComment?: {
    id: number
    documentId: string
    content?: string
  }
  reporter?: {
    id: number
    documentId: string
    username: string
    email?: string
  }
  reviewedBy?: {
    id: number
    documentId: string
    username: string
  }
  reviewedAt?: string
  reviewNotes?: string
}

export type ReportReason =
  | "spam"
  | "offensive"
  | "inappropriate"
  | "harassment"
  | "copyright"
  | "misinformation"
  | "adult_content"
  | "other"

export type FlagStatus = "pending" | "reviewed" | "resolved" | "dismissed"

export interface CreateContentFlagData {
  reportedPost?: string // documentId of post
  reportedComment?: string // documentId of comment
  reason: ReportReason
  description?: string
  reporterEmail?: string // Required for anonymous reports
}

export interface UpdateContentFlagData {
  status?: FlagStatus
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface ContentFlagResponse {
  data: ContentFlag
  meta?: any
}

export interface ContentFlagsListResponse {
  data: ContentFlag[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface ContentFlagStats {
  pending: number
  reviewed: number
  resolved: number
  dismissed: number
}

// Service response types
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Helper function to make proxy requests
 */
async function proxyRequest(endpoint: string, options: {
  method?: string
  data?: any
  useServerToken?: boolean
} = {}): Promise<Response> {
  const { method = "GET", data, useServerToken = false } = options

  return await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ endpoint, method, data, useServerToken }),
  })
}

/**
 * Parse error response from API
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data?.error?.message || data?.message || response.statusText || "Unknown error"
  } catch (error) {
    const text = await response.text().catch(() => "")
    return text || `HTTP ${response.status}`
  }
}

export class ContentFlagsService {
  /**
   * Create a new content flag (report)
   * POST /api/content-flags
   */
  static async createContentFlag(
    flagData: CreateContentFlagData
  ): Promise<ServiceResponse<ContentFlag>> {
    try {
      // Validate that either reportedPost or reportedComment is provided
      if (!flagData.reportedPost && !flagData.reportedComment) {
        return {
          success: false,
          error: "Must specify either reportedPost or reportedComment"
        }
      }

      // Validate that both are not provided
      if (flagData.reportedPost && flagData.reportedComment) {
        return {
          success: false,
          error: "Cannot report both post and comment in the same flag"
        }
      }

      console.log("[ContentFlagsService] Creating content flag:", flagData)

      const response = await proxyRequest("/api/content-flags", {
        method: "POST",
        data: {
          data: flagData
        }
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        console.error("[ContentFlagsService] Create flag error:", errorMessage)
        return {
          success: false,
          error: errorMessage
        }
      }

      const result: ContentFlagResponse = await response.json()
      console.log("[ContentFlagsService] Flag created successfully:", result.data)

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      console.error("[ContentFlagsService] Create flag exception:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Get content flags with filtering and pagination
   * GET /api/content-flags
   */
  static async getContentFlags(options: {
    status?: FlagStatus
    reportedPost?: string
    reportedComment?: string
    populate?: string | string[]
    sort?: string
    page?: number
    pageSize?: number
  } = {}): Promise<ServiceResponse<ContentFlagsListResponse>> {
    try {
      const {
        status,
        reportedPost,
        reportedComment,
        populate = "*",
        sort = "createdAt:desc",
        page = 1,
        pageSize = 25
      } = options

      // Build query parameters using URLSearchParams
      const queryParams = new URLSearchParams()

      // Add filters
      if (status) {
        queryParams.set("filters[status]", status)
      }
      if (reportedPost) {
        queryParams.set("filters[reportedPost]", reportedPost)
      }
      if (reportedComment) {
        queryParams.set("filters[reportedComment]", reportedComment)
      }

      // Add population
      if (typeof populate === "string") {
        queryParams.set("populate", populate)
      } else if (Array.isArray(populate)) {
        populate.forEach((field, index) => {
          queryParams.set(`populate[${index}]`, field)
        })
      }

      // Add sorting
      queryParams.set("sort", sort)

      // Add pagination
      queryParams.set("pagination[page]", page.toString())
      queryParams.set("pagination[pageSize]", pageSize.toString())

      const endpoint = `/api/content-flags?${queryParams.toString()}`
      console.log("[ContentFlagsService] Fetching flags:", endpoint)

      const response = await proxyRequest(endpoint, {
        method: "GET",
        useServerToken: true
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        console.error("[ContentFlagsService] Fetch flags error:", errorMessage)
        return {
          success: false,
          error: errorMessage
        }
      }

      const result: ContentFlagsListResponse = await response.json()
      console.log("[ContentFlagsService] Flags fetched:", {
        count: result.data.length,
        total: result.meta.pagination.total
      })

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error("[ContentFlagsService] Fetch flags exception:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Get a specific content flag by documentId
   * GET /api/content-flags/{documentId}
   */
  static async getContentFlag(
    documentId: string,
    populate: string | string[] = "*"
  ): Promise<ServiceResponse<ContentFlag>> {
    try {
      const queryParams = new URLSearchParams()

      if (typeof populate === "string") {
        queryParams.set("populate", populate)
      } else if (Array.isArray(populate)) {
        populate.forEach((field, index) => {
          queryParams.set(`populate[${index}]`, field)
        })
      }

      const endpoint = `/api/content-flags/${documentId}?${queryParams.toString()}`
      console.log("[ContentFlagsService] Fetching flag:", endpoint)

      const response = await proxyRequest(endpoint, {
        method: "GET",
        useServerToken: true
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: "Content flag not found"
          }
        }
        const errorMessage = await parseErrorResponse(response)
        return {
          success: false,
          error: errorMessage
        }
      }

      const result: ContentFlagResponse = await response.json()

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      console.error("[ContentFlagsService] Fetch flag exception:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Update a content flag (for moderation)
   * PUT /api/content-flags/{documentId}
   */
  static async updateContentFlag(
    documentId: string,
    updateData: UpdateContentFlagData
  ): Promise<ServiceResponse<ContentFlag>> {
    try {
      console.log("[ContentFlagsService] Updating flag:", documentId, updateData)

      const response = await proxyRequest(`/api/content-flags/${documentId}`, {
        method: "PUT",
        data: {
          data: updateData
        }
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        console.error("[ContentFlagsService] Update flag error:", errorMessage)
        return {
          success: false,
          error: errorMessage
        }
      }

      const result: ContentFlagResponse = await response.json()
      console.log("[ContentFlagsService] Flag updated successfully:", result.data)

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      console.error("[ContentFlagsService] Update flag exception:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Delete a content flag
   * DELETE /api/content-flags/{documentId}
   */
  static async deleteContentFlag(documentId: string): Promise<ServiceResponse<void>> {
    try {
      console.log("[ContentFlagsService] Deleting flag:", documentId)

      const response = await proxyRequest(`/api/content-flags/${documentId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        console.error("[ContentFlagsService] Delete flag error:", errorMessage)
        return {
          success: false,
          error: errorMessage
        }
      }

      console.log("[ContentFlagsService] Flag deleted successfully")

      return {
        success: true
      }
    } catch (error) {
      console.error("[ContentFlagsService] Delete flag exception:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Get pending reports (requires moderator privileges)
   * GET /api/content-flags/pending
   */
  static async getPendingReports(): Promise<ServiceResponse<ContentFlag[]>> {
    try {
      console.log("[ContentFlagsService] Fetching pending reports")

      const response = await proxyRequest("/api/content-flags/pending", {
        method: "GET"
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        console.error("[ContentFlagsService] Fetch pending reports error:", errorMessage)
        return {
          success: false,
          error: errorMessage
        }
      }

      const reports: ContentFlag[] = await response.json()
      console.log("[ContentFlagsService] Pending reports fetched:", reports.length)

      return {
        success: true,
        data: reports
      }
    } catch (error) {
      console.error("[ContentFlagsService] Fetch pending reports exception:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  /**
   * Get moderation statistics (requires moderator privileges)
   * GET /api/content-flags/stats
   */
  static async getModerationStats(): Promise<ServiceResponse<ContentFlagStats>> {
    try {
      console.log("[ContentFlagsService] Fetching moderation stats")

      const response = await proxyRequest("/api/content-flags/stats", {
        method: "GET"
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        console.error("[ContentFlagsService] Fetch stats error:", errorMessage)
        return {
          success: false,
          error: errorMessage
        }
      }

      const stats: ContentFlagStats = await response.json()
      console.log("[ContentFlagsService] Moderation stats fetched:", stats)

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error("[ContentFlagsService] Fetch stats exception:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }
}

// Convenience instance with simplified API
export const contentFlagsService = {
  /**
   * Report a post
   */
  reportPost: (
    postDocumentId: string,
    reason: ReportReason,
    description?: string,
    reporterEmail?: string
  ) => ContentFlagsService.createContentFlag({
    reportedPost: postDocumentId,
    reason,
    description,
    reporterEmail
  }),

  /**
   * Report a comment
   */
  reportComment: (
    commentDocumentId: string,
    reason: ReportReason,
    description?: string,
    reporterEmail?: string
  ) => ContentFlagsService.createContentFlag({
    reportedComment: commentDocumentId,
    reason,
    description,
    reporterEmail
  }),

  /**
   * Get reports for a specific post
   */
  getPostReports: (postDocumentId: string) =>
    ContentFlagsService.getContentFlags({
      reportedPost: postDocumentId,
      populate: ["reporter", "reviewedBy"],
      sort: "createdAt:desc"
    }),

  /**
   * Get reports for a specific comment
   */
  getCommentReports: (commentDocumentId: string) =>
    ContentFlagsService.getContentFlags({
      reportedComment: commentDocumentId,
      populate: ["reporter", "reviewedBy"],
      sort: "createdAt:desc"
    }),

  /**
   * Get all pending reports
   */
  getPendingReports: () => ContentFlagsService.getPendingReports(),

  /**
   * Review a report (for moderators)
   */
  reviewReport: (
    documentId: string,
    status: FlagStatus,
    reviewNotes?: string
  ) => ContentFlagsService.updateContentFlag(documentId, {
    status,
    reviewNotes,
    reviewedAt: new Date().toISOString()
  }),

  /**
   * Get moderation statistics
   */
  getStats: () => ContentFlagsService.getModerationStats(),

  // Direct access to main service methods
  ...ContentFlagsService
}
