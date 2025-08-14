import qs from "qs"
import { fetchWithRetry, safeJsonParse } from "../fetch-with-retry"
import { API_URL, REQUEST_CONFIG, getServerApiToken } from "../config"

// Runtime helpers
const isServer = typeof window === "undefined"
const serverToken = getServerApiToken()
const useProxy = !isServer || !serverToken // Use proxy on client or if no server token is available

// Join base and path
const joinUrl = (base: string, path: string) => {
  const b = base.endsWith("/") ? base.slice(0, -1) : base
  const p = path.startsWith("/") ? path : `/${path}`
  return `${b}${p}`
}

// Call our server proxy for JSON requests
const proxyJson = async (endpoint: string, method = "GET", data?: any) => {
  const res = await fetch("/api/auth-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ endpoint, method, data }),
  })
  return res
}

// Call Strapi directly on server
const directJson = async (fullUrl: string, method = "GET", headers: HeadersInit = {}, body?: any) => {
  return fetchWithRetry(
    fullUrl,
    {
      method,
      headers,
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    },
    2,
  )
}

export type ContentType = "image" | "video" | "text" | "text-background" | "media-gallery"
export type GalleryLayout = "grid" | "carousel" | "featured"

export class PostService {
  // Helper function to construct full URLs for media items
  private static getFullUrl(relativePath: string): string {
    if (!relativePath) return ""
    if (relativePath.startsWith("http")) return relativePath
    return `${API_URL}${relativePath.startsWith("/") ? "" : "/"}${relativePath}`
  }

  // Get posts with pagination
  static async getPosts(page = 1, pageSize = 10, cacheBuster?: number) {
    // Client-side throttling
    const now = Date.now()
    PostService.requestTracker.lastRequestTime ??= 0
    const timeSinceLast = now - PostService.requestTracker.lastRequestTime
    if (timeSinceLast < PostService.requestTracker.minRequestInterval) {
      await new Promise((r) => setTimeout(r, PostService.requestTracker.minRequestInterval - timeSinceLast))
    }
    PostService.requestTracker.lastRequestTime = Date.now()

    try {
      const query = {
        fields: [
          "id",
          "documentId",
          "description",
          "contentType",
          "galleryLayout",
          "publishedAt",
          "likesCount",
          "commentsCount",
          "title",
        ],
        populate: {
          user: {
            fields: ["id", "username", "displayName", "documentId"],
            populate: { profileImage: { fields: ["url", "formats"] } },
          },
          mediaItems: {
            fields: ["id", "type", "order", "documentId"],
            populate: { file: { fields: ["url", "formats"] } },
          },
          tags: { fields: ["id", "name", "documentId"] },
          likes: {
            fields: ["type", "createdAt"],
            populate: {
              user: {
                fields: ["username", "email"],
                populate: {
                  profileImage: {
                    fields: ["url", "formats"],
                  },
                },
              },
            },
          },
        },
        pagination: { page, pageSize },
        sort: ["publishedAt:desc"],
      }

      const queryString = qs.stringify(query, { encodeValuesOnly: true })
      const cacheParam = cacheBuster ? `&_cb=${cacheBuster}` : ""
      const endpoint = `/api/posts?${queryString}${cacheParam}`

      // Perform request (proxy on client, direct on server)
      let resp: Response
      if (useProxy) {
        resp = await proxyJson(endpoint, "GET")
      } else {
        const fullUrl = joinUrl(API_URL, endpoint)
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (serverToken) headers["Authorization"] = `Bearer ${serverToken}`
        resp = await directJson(fullUrl, "GET", headers)
      }

      if (resp.status === 429) {
        return { error: { code: "429", message: "Too Many Requests" } }
      }
      if (!resp.ok) {
        return {
          error: {
            code: String(resp.status),
            message: resp.statusText || "HTTP error",
          },
        }
      }

      const data = await safeJsonParse(resp)
      if (data.error) return data
      return data
    } catch (error) {
      return {
        error: {
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }
    }
  }

  // Get posts by username
  static async getPostsByUsername(username: string, token?: string): Promise<any[]> {
    try {
      const query = {
        filters: { user: { username: { $eq: username } } },
        fields: [
          "id",
          "documentId",
          "description",
          "contentType",
          "galleryLayout",
          "publishedAt",
          "likesCount",
          "commentsCount",
          "title",
        ],
        populate: {
          user: {
            fields: ["id", "username", "displayName", "documentId"],
            populate: { profileImage: { fields: ["url", "formats"] } },
          },
          mediaItems: {
            fields: ["id", "type", "order", "documentId"],
            populate: { file: { fields: ["url", "formats"] } },
          },
          tags: { fields: ["id", "name", "documentId"] },
          likes: {
            fields: ["type", "createdAt"],
            populate: {
              user: {
                fields: ["username", "email"],
                populate: {
                  profileImage: {
                    fields: ["url", "formats"],
                  },
                },
              },
            },
          },
        },
        sort: ["publishedAt:desc"],
        pagination: { pageSize: 50 },
      }

      let res: Response
      if (useProxy) {
        res = await proxyJson(`/api/posts?${qs.stringify(query)}`, "GET")
      } else {
        const fullUrl = joinUrl(API_URL, `/api/posts?${qs.stringify(query)}`)
        const headers: HeadersInit = { "Content-Type": "application/json" }
        const auth = token || serverToken
        if (auth) headers["Authorization"] = `Bearer ${auth}`
        res = await fetch(fullUrl, {
          method: "GET",
          headers,
          cache: "no-store",
        })
      }

      if (!res.ok) return []
      const responseData = await res.json()

      let posts: any[] = []
      if (responseData.data && Array.isArray(responseData.data)) posts = responseData.data
      else if (responseData.results && Array.isArray(responseData.results)) posts = responseData.results
      else if (Array.isArray(responseData)) posts = responseData

      return posts
    } catch {
      return []
    }
  }

  // Get a single post by ID or documentId
  static async getPost(idOrDocumentId: string | number) {
    try {
      const isNumericId = !isNaN(Number(idOrDocumentId))
      const query = {
        fields: [
          "id",
          "documentId",
          "description",
          "contentType",
          "galleryLayout",
          "publishedAt",
          "likesCount",
          "commentsCount",
          "title",
        ],
        populate: {
          user: {
            fields: ["id", "username", "displayName", "documentId"],
            populate: { profileImage: { fields: ["url", "formats"] } },
          },
          mediaItems: {
            fields: ["id", "type", "order", "documentId"],
            populate: { file: { fields: ["url", "formats"] } },
          },
          tags: { fields: ["id", "name", "documentId"] },
          likes: {
            fields: ["type", "createdAt"],
            populate: {
              user: {
                fields: ["username", "email"],
                populate: {
                  profileImage: {
                    fields: ["url", "formats"],
                  },
                },
              },
            },
          },
        },
        ...(!isNumericId ? { filters: { documentId: { $eq: idOrDocumentId } } } : {}),
      }

      let resp: Response
      if (useProxy) {
        resp = await proxyJson(`/api/posts${isNumericId ? `/${idOrDocumentId}` : `?${qs.stringify(query)}`}`, "GET")
      } else {
        const fullUrl = joinUrl(API_URL, `/api/posts${isNumericId ? `/${idOrDocumentId}` : `?${qs.stringify(query)}`}`)
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (serverToken) headers["Authorization"] = `Bearer ${serverToken}`
        resp = await fetchWithRetry(fullUrl, { method: "GET", headers })
      }

      if (!resp.ok) {
        const errorData = await safeJsonParse(resp)
        return {
          error: {
            code: String(resp.status),
            message: errorData?.error?.message || resp.statusText || "Unknown error",
          },
        }
      }

      const data = await safeJsonParse(resp)

      if (!isNumericId && data.data && Array.isArray(data.data) && data.data.length > 0) {
        return { data: data.data[0], meta: data.meta }
      }

      return data
    } catch (error) {
      return {
        error: {
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }
    }
  }

  // Create a new post (supports client via proxy upload)
  static async createPost(postData: {
    title: string
    description: string
    contentType?: ContentType
    background?: any
    featured?: boolean
    galleryLayout?: GalleryLayout
    userId?: string // Strapi 5 relation (documentId)
    tags?: string[]
    mediaFiles?: File[]
  }) {
    try {
      const { userId, tags = [], mediaFiles = [], ...postFields } = postData
      const apiUrl = API_URL

      // STEP 1: Upload media files
      let uploadedMediaItems: any[] = []
      if (mediaFiles.length > 0) {
        if (useProxy) {
          // Upload through proxy to keep token server-side
          const uploadFormData = new FormData()
          mediaFiles.forEach((file, idx) => uploadFormData.append("files", file, `${idx}-${file.name}`))
          const uploadRes = await fetch(`/api/auth-proxy/upload?endpoint=${encodeURIComponent("/api/upload")}`, {
            method: "POST",
            body: uploadFormData,
          })
          if (!uploadRes.ok) {
            const errorText = await uploadRes.text()
            throw new Error(`File upload failed with status ${uploadRes.status}: ${errorText}`)
          }
          const uploadedFiles = await uploadRes.json()
          uploadedMediaItems = uploadedFiles.map((file: any, index: number) => ({
            file: file.id,
            type: file.mime?.startsWith("image/") ? "image" : "video",
            order: index + 1,
          }))
        } else {
          // Server direct upload
          const token = serverToken || ""
          const headers: HeadersInit = { Authorization: `Bearer ${token}` }
          const uploadFormData = new FormData()
          mediaFiles.forEach((file, idx) => uploadFormData.append("files", file, `${idx}-${file.name}`))
          const uploadUrl = joinUrl(apiUrl, "/api/upload")
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers,
            body: uploadFormData,
          })
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(`File upload failed with status ${uploadResponse.status}: ${errorText}`)
          }
          const uploadedFiles = await uploadResponse.json()
          uploadedMediaItems = uploadedFiles.map((file: any, index: number) => ({
            file: file.id,
            type: file.mime?.startsWith("image/") ? "image" : "video",
            order: index + 1,
          }))
        }
      }

      // STEP 2: Create post
      const data = {
        data: {
          ...postFields,
          ...(userId ? { user: { connect: [userId] } } : {}),
          tags,
          mediaItems: uploadedMediaItems,
        },
      }

      let createRes: Response
      if (useProxy) {
        createRes = await proxyJson("/api/posts", "POST", data)
      } else {
        const token = serverToken || ""
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
        const fullUrl = joinUrl(apiUrl, "/api/posts")
        createRes = await fetch(fullUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        })
      }

      if (!createRes.ok) {
        const errorText = await createRes.text()
        throw new Error(`API error (${createRes.status}): ${errorText}`)
      }

      let response = await createRes.json()

      // STEP 3: Fetch complete post data
      try {
        if (response.data?.id) {
          const completeQuery = qs.stringify(
            {
              populate: {
                user: {
                  fields: ["id", "username", "displayName", "documentId"],
                  populate: { profileImage: { fields: ["url", "formats"] } },
                },
                mediaItems: {
                  fields: ["id", "type", "order", "file"],
                  populate: { file: { fields: ["url", "formats"] } },
                },
                tags: { fields: ["id", "name", "documentId"] },
                likes: {
                  fields: ["type", "createdAt"],
                  populate: {
                    user: {
                      fields: ["username", "email"],
                      populate: {
                        profileImage: {
                          fields: ["url", "formats"],
                        },
                      },
                    },
                  },
                },
              },
            },
            { encodeValuesOnly: true },
          )
          const completeEndpoint = `/api/posts/${response.data.id}?${completeQuery}`
          let completeRes: Response
          if (useProxy) {
            completeRes = await proxyJson(completeEndpoint, "GET")
          } else {
            const token = serverToken || ""
            const headers: HeadersInit = { Authorization: `Bearer ${token}` }
            const fullUrl = joinUrl(apiUrl, completeEndpoint)
            completeRes = await fetch(fullUrl, { method: "GET", headers })
          }
          if (completeRes.ok) {
            const completeData = await completeRes.json()
            response = { ...response, completeData }
          }
        }
      } catch (err) {
        console.error("PostService: Failed to fetch complete post data:", err)
      }

      return response
    } catch (error) {
      throw error
    }
  }

  static async updatePost(id: number | string, postData: any) {
    try {
      const data = { data: postData }

      let res: Response
      if (useProxy) {
        res = await proxyJson(`/api/posts/${id}`, "PUT", data)
      } else {
        const token = serverToken || ""
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
        const fullUrl = joinUrl(API_URL, `/api/posts/${id}`)
        res = await fetch(fullUrl, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        })
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`API error (${res.status}): ${errorText}`)
      }
      return await res.json()
    } catch (error) {
      throw error
    }
  }

  static async deletePost(id: number | string) {
    try {
      let res: Response
      if (useProxy) {
        res = await proxyJson(`/api/posts/${id}`, "DELETE")
      } else {
        const token = serverToken || ""
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
        const fullUrl = joinUrl(API_URL, `/api/posts/${id}`)
        res = await fetch(fullUrl, { method: "DELETE", headers })
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`API error (${res.status}): ${errorText}`)
      }
      return await res.json()
    } catch (error) {
      throw error
    }
  }

  // Like a post
  static async likePost(postId: number | string, userId: number | string) {
    try {
      const data = {
        data: {
          post: {
            connect: [typeof postId === "string" ? postId : postId.toString()],
          },
          user: {
            connect: [typeof userId === "string" ? userId : userId.toString()],
          },
        },
      }

      let res: Response
      if (useProxy) {
        res = await proxyJson("/api/likes", "POST", data)
      } else {
        const token = serverToken || ""
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
        const fullUrl = joinUrl(API_URL, "/api/likes")
        res = await fetch(fullUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        })
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`API error (${res.status}): ${errorText}`)
      }

      return await res.json()
    } catch (error) {
      throw error
    }
  }

  // Unlike a post
  static async unlikePost(likeId: number | string) {
    try {
      let res: Response
      if (useProxy) {
        res = await proxyJson(`/api/likes/${likeId}`, "DELETE")
      } else {
        const token = serverToken || ""
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
        const fullUrl = joinUrl(API_URL, `/api/likes/${likeId}`)
        res = await fetch(fullUrl, { method: "DELETE", headers })
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`API error (${res.status}): ${errorText}`)
      }

      return await res.json()
    } catch (error) {
      throw error
    }
  }

  // Add tags to a post
  static async addTagsToPost(postId: number | string, tags: string[]) {
    try {
      const postResponse = await this.getPost(postId)
      const postData = (postResponse as any)?.data || {}

      const existingTags = postData.tags || []
      const newTags = [...existingTags, ...tags.map((name) => ({ name }))]

      const updateData = { tags: newTags }
      return await this.updatePost(postId, updateData)
    } catch (error) {
      throw error
    }
  }

  // internal request throttling
  private static requestTracker = {
    lastRequestTime: 0,
    minRequestInterval: REQUEST_CONFIG.minRequestInterval,
  }
}
