import { normalizeImageUrl } from "@/lib/image-utils"

const PROXY_URL = "/api/auth-proxy"

type FetchRetryOptions = {
  retries?: number
  retryDelay?: number
}

type ProxyRequestOptions = {
  method?: string
  data?: any
  useServerToken?: boolean
}

async function proxyRequest(endpoint: string, options: ProxyRequestOptions = {}): Promise<Response> {
  const { method = "GET", data, useServerToken = false } = options

  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ endpoint, method, data, useServerToken }),
  })

  return res
}

async function proxyRequestWithRetry(
  endpoint: string,
  options: ProxyRequestOptions = {},
  retryOptions: FetchRetryOptions = {},
): Promise<Response> {
  const { retries = 2, retryDelay = 500 } = retryOptions

  try {
    const response = await proxyRequest(endpoint, options)

    if (!response.ok && response.status !== 404) {
      throw new Error("HTTP error! status: " + response.status)
    }

    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
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

export interface CommentAttachment {
  id: string
  url: string
  formats?: Record<string, { url?: string }>
}

export interface Comment {
  id: number
  documentId: string
  content: string | null
  author: CommentAuthor
  createdAt: string
  updatedAt: string
  children: Comment[]
  parentDocumentId?: string | null
  attachment?: CommentAttachment | null
  replies?: Comment[]
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

const resolvePostDocumentId = (postId: string | number, documentId?: string): string => {
  if (documentId) return documentId
  if (postId === undefined || postId === null) return ""
  return String(postId)
}

const resolveAuthorAvatar = (raw: any): string | undefined => {
  if (!raw) return undefined

  const candidateList: Array<string | undefined> = []

  const profileImageEntity = raw.profileImage?.data?.attributes || raw.profileImage?.attributes || raw.profileImage
  if (profileImageEntity) {
    candidateList.push(profileImageEntity.url)
    candidateList.push(profileImageEntity.formats?.thumbnail?.url)
    candidateList.push(profileImageEntity.formats?.small?.url)
    candidateList.push(profileImageEntity.formats?.medium?.url)
  }

  candidateList.push(raw.avatar?.url)
  candidateList.push(raw.avatar)

  const resolved = candidateList.find((value) => typeof value === "string" && value.trim().length > 0)
  return resolved ? normalizeImageUrl(resolved) : undefined
}

const toAuthor = (raw: any): CommentAuthor => {
  const id = raw && (raw.documentId || raw.id)
  const username = raw && (raw.username || raw.displayName)
  const email = raw && raw.email

  return {
    id: id ? String(id) : "unknown",
    name: username || email || "Anonymous",
    email: email || undefined,
    avatar: resolveAuthorAvatar(raw),
  }
}

const toAttachment = (raw: any): CommentAttachment | null => {
  if (!raw) return null

  const node = raw.data?.attributes || raw
  const id = node && (node.documentId || node.id)
  const formats = node?.formats
  let url = node?.url

  if (!url) {
    url =
      node?.formats?.medium?.url ||
      node?.formats?.small?.url ||
      node?.formats?.thumbnail?.url
  }

  if (!url) return null

  return {
    id: id ? String(id) : "attachment",
    url: normalizeImageUrl(url),
    formats,
  }
}

const transformComment = (raw: any): Comment => {
  const childrenArray = Array.isArray(raw?.children) ? raw.children : []
  const children = childrenArray.map(transformComment)
  const author = toAuthor(raw?.author || {})
  const attachment = toAttachment(raw?.image)

  return {
    id: Number(raw?.id ?? 0),
    documentId: String(raw?.documentId || raw?.id || ""),
    content: raw?.content ?? null,
    author,
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || raw?.createdAt || new Date().toISOString(),
    children,
    parentDocumentId: raw?.parent?.documentId || null,
    attachment,
    replies: children,
  }
}

const buildPagination = (meta: any, fallback: { page: number; pageSize: number }): PaginationInfo => {
  if (meta?.pagination) {
    return {
      page: Number(meta.pagination.page ?? fallback.page),
      pageSize: Number(meta.pagination.pageSize ?? fallback.pageSize),
      pageCount: Number(meta.pagination.pageCount ?? 1),
      total: Number(meta.pagination.total ?? 0),
    }
  }

  return {
    page: fallback.page,
    pageSize: fallback.pageSize,
    pageCount: 1,
    total: 0,
  }
}

const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const data = await response.json()
    return data?.error?.message || data?.message || response.statusText || "Unknown error"
  } catch (error) {
    const text = await response.text().catch(() => "")
    return text || "HTTP " + response.status
  }
}

export class CommentsService {
  static async getComments(
    postId: string | number,
    documentId?: string,
    page = 1,
    pageSize = 5,
    depth = 5,
  ): Promise<CommentsResponse> {
    try {
      const postDocumentId = resolvePostDocumentId(postId, documentId)

      if (!postDocumentId) {
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      const searchParams = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort: "createdAt:desc",
        depth: String(depth),
      })

      const endpoint = "/api/comments/post/" + encodeURIComponent(postDocumentId) + "?" + searchParams.toString()
      const response = await proxyRequestWithRetry(
        endpoint,
        { method: "GET", useServerToken: true },
        { retries: 2, retryDelay: 500 },
      )

      if (response.status === 404) {
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      if (!response.ok) {
        const errorText = await parseErrorResponse(response)
        console.error("Error fetching comments:", errorText)
        return {
          data: [],
          pagination: { page: 1, pageSize, pageCount: 1, total: 0 },
        }
      }

      const payload = await response.json().catch(() => ({ data: [] }))
      const comments = Array.isArray(payload?.data) ? payload.data.map(transformComment) : []
      const pagination = buildPagination(payload?.meta, { page, pageSize })

      return {
        data: comments,
        pagination,
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

    return comments.reduce((total, comment) => {
      const childCount = comment.children ? CommentsService.countTotalComments(comment.children) : 0
      return total + 1 + childCount
    }, 0)
  }

  static async addComment(
    postId: string | number,
    documentId: string | undefined,
    content: string,
    parentDocumentId?: string,
  ): Promise<{ success: boolean; comment?: Comment; error?: string }> {
    try {
      const postDocumentId = resolvePostDocumentId(postId, documentId)

      if (!postDocumentId) {
        return { success: false, error: "Missing post identifier" }
      }

      const payload: Record<string, any> = {
        postId: postDocumentId,
      }

      if (content && content.trim().length > 0) {
        payload.content = content.trim()
      }

      if (parentDocumentId) {
        payload.parentId = parentDocumentId
      }


      const response = await proxyRequest("/api/comments", {
        method: "POST",
        data: payload,
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        return { success: false, error: errorMessage }
      }

      const result = await response.json().catch(() => null)
      const createdComment = result ? transformComment(result.data || result) : undefined

      return {
        success: true,
        comment: createdComment,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  static async updateComment(
    commentDocumentId: string,
    content?: string,
    imageDocumentId?: string | number | null,
  ): Promise<{ success: boolean; comment?: Comment; error?: string }> {
    try {
      if (!commentDocumentId) {
        return { success: false, error: "Missing comment identifier" }
      }

      const payload: Record<string, any> = {}

      if (typeof content === "string") {
        payload.content = content.trim()
      }

      if (imageDocumentId !== undefined) {
        payload.imageId = imageDocumentId ? String(imageDocumentId) : null
      }

      const endpoint = "/api/comments/" + encodeURIComponent(commentDocumentId)
      const response = await proxyRequest(endpoint, {
        method: "PUT",
        data: payload,
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        return { success: false, error: errorMessage }
      }

      const result = await response.json().catch(() => null)
      const updatedComment = result ? transformComment(result.data || result) : undefined

      return {
        success: true,
        comment: updatedComment,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  static async deleteComment(commentDocumentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!commentDocumentId) {
        return { success: false, error: "Missing comment identifier" }
      }

      const endpoint = "/api/comments/" + encodeURIComponent(commentDocumentId)
      const response = await proxyRequest(endpoint, { method: "DELETE" })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        return { success: false, error: errorMessage }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }

  static async reportCommentAbuse(
    commentDocumentId: string,
    reason: string,
    content: string,
    reporterEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!commentDocumentId) {
        return { success: false, error: "Missing comment identifier" }
      }

      const endpoint = "/api/content-flags"
      const response = await proxyRequest(endpoint, {
        method: "POST",
        data: {
          data: {
            reportedComment: commentDocumentId,
            reason,
            description: content,
            ...(reporterEmail && { reporterEmail })
          }
        },
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        return { success: false, error: errorMessage }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }
    }
  }
}

export const commentsService = {
  getComments: CommentsService.getComments.bind(CommentsService),
  addComment: (
    content: string,
    relatedTo: string,
    relatedId: string | number,
    parentDocumentId?: string,
  ) =>
    CommentsService.addComment(
      relatedId,
      relatedTo === "posts" ? undefined : relatedTo,
      content,
      parentDocumentId,
    ),
  updateComment: (commentDocumentId: string, content?: string, imageDocumentId?: string | number | null) =>
    CommentsService.updateComment(commentDocumentId, content, imageDocumentId ?? undefined),
  deleteComment: (commentDocumentId: string) => CommentsService.deleteComment(commentDocumentId),
  reportCommentAbuse: (commentDocumentId: string, reason: string, content: string, reporterEmail?: string) =>
    CommentsService.reportCommentAbuse(commentDocumentId, reason, content, reporterEmail),
  countTotalComments: CommentsService.countTotalComments.bind(CommentsService),
}
