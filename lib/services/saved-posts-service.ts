"use server"

import qs from "qs"
import { verifySession } from "@/lib/auth/session"
import { transformStrapiPost, type Post } from "@/lib/post-data"

const FALLBACK_API_URL = "http://127.0.0.1:1337"

function getApiBaseUrl(): string {
  const url =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_URL
  return url.endsWith("/") ? url.slice(0, -1) : url
}

export interface SavedPostItem {
  /** Identifier of the saved-post relation entry */
  id: number
  /** Stable documentId for the saved-post entry */
  documentId?: string
  /** Timestamp when the user saved the post */
  savedAt: string
  /** Normalized post data ready for UI consumption */
  post: Post
}

export interface FetchSavedPostsOptions {
  page?: number
  pageSize?: number
}

export interface SavedPostsResult {
  items: SavedPostItem[]
  page: number
  pageSize: number
  total: number
  pageCount: number
}

export async function fetchSavedPosts(
  options: FetchSavedPostsOptions = {},
): Promise<SavedPostsResult> {
  const session = await verifySession()

  if (!session?.strapiJWT || !session.userId) {
    throw new Error("Authentication required")
  }

  const page = options.page && options.page > 0 ? options.page : 1
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 40

  const query = qs.stringify(
    {
      fields: ["id", "documentId", "createdAt"],
      filters: {
        user: {
          id: {
            $eq: session.userId,
          },
        },
      },
      populate: {
        post: {
          fields: [
            "id",
            "documentId",
            "title",
            "description",
            "contentType",
            "background",
            "galleryLayout",
            "likesCount",
            "commentsCount",
            "savesCount",
            "viewsCount",
            "shareCount",
            "createdAt",
            "updatedAt",
            "publishedAt",
          ],
          populate: {
            user: {
              fields: ["id", "documentId", "username", "displayName"],
              populate: {
                profileImage: {
                  fields: ["url", "formats"],
                },
              },
            },
            media: {
              fields: [
                "id",
                "documentId",
                "url",
                "formats",
                "mime",
                "width",
                "height",
                "name",
              ],
            },
            tags: {
              fields: ["id", "documentId", "name"],
            },
          },
        },
      },
      sort: ["createdAt:desc"],
      pagination: {
        page,
        pageSize,
      },
    },
    { encodeValuesOnly: true },
  )

  const endpoint = getApiBaseUrl() + "/api/saved-posts?" + query
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.strapiJWT,
    },
    cache: "no-store",
    next: { revalidate: 0, tags: ["saved-posts"] },
  })

  if (!response.ok) {
    const errorText = await response.text()
    const message =
      "Failed to fetch saved posts (" +
      response.status +
      "): " +
      (errorText || response.statusText)
    throw new Error(message)
  }

  const payload = await response.json()
  const entries = Array.isArray(payload?.data) ? payload.data : []

  const items: SavedPostItem[] = entries
    .map((entry: any) => {
      const attributes = entry?.attributes ?? {}
      const postData = attributes.post?.data ?? entry?.post?.data ?? entry?.post
      if (!postData) {
        return null
      }

      try {
        const normalizedPost = transformStrapiPost(postData, session.userId)
        return {
          id: entry.id ?? attributes.id,
          documentId: attributes?.documentId ?? entry.documentId,
          savedAt:
            attributes?.createdAt ??
            attributes?.updatedAt ??
            new Date().toISOString(),
          post: normalizedPost,
        } satisfies SavedPostItem
      } catch (error) {
        console.error("Failed to normalize saved post entry", {
          error,
          entry,
        })
        return null
      }
    })
    .filter(Boolean) as SavedPostItem[]

  const pagination = payload?.meta?.pagination ?? {}

  return {
    items,
    page: pagination.page ?? page,
    pageSize: pagination.pageSize ?? pageSize,
    total: pagination.total ?? items.length,
    pageCount: pagination.pageCount ?? 1,
  }
}
