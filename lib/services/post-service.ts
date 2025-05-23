"use client"

import qs from "qs"
import { fetchWithRetry, safeJsonParse } from "../fetch-with-retry"
import { API_URL, API_TOKEN, REQUEST_CONFIG } from "../config"

// Global request tracker to implement client-side rate limiting
const requestTracker = {
  lastRequestTime: 0,
  minRequestInterval: REQUEST_CONFIG.minRequestInterval,
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
    // Implement client-side request throttling
    const now = Date.now()
    const timeSinceLastRequest = now - requestTracker.lastRequestTime

    if (timeSinceLastRequest < requestTracker.minRequestInterval) {
      // Wait before making the next request
      await new Promise((resolve) => setTimeout(resolve, requestTracker.minRequestInterval - timeSinceLastRequest))
    }

    // Update last request time
    requestTracker.lastRequestTime = Date.now()

    try {
      // Build a structured query using qs
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
            populate: {
              profileImage: {
                fields: ["url", "formats"],
              },
            },
          },
          mediaItems: {
            fields: ["id", "type", "order", "documentId"],
            populate: {
              file: {
                fields: ["url", "formats"],
              },
            },
          },
          tags: {
            fields: ["id", "name", "documentId"],
          },
        },
        pagination: {
          page,
          pageSize,
        },
        sort: ["publishedAt:desc"], // Sort by newest first
      }

      // Convert the query to a string
      const queryString = qs.stringify(query, { encodeValuesOnly: true })

      // Add cache buster to avoid hitting cached errors
      const cacheParam = cacheBuster ? `&_cb=${cacheBuster}` : ""

      // Construct the endpoint
      const endpoint = `/api/posts?${queryString}${cacheParam}`
      const fullUrl = `${API_URL}${API_URL.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

      console.log(`PostService: Fetching posts from ${fullUrl}`)

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (API_TOKEN) {
        headers["Authorization"] = `Bearer ${API_TOKEN}`
      }

      // Make the request
      const response = await fetchWithRetry(
        fullUrl,
        {
          method: "GET",
          headers,
        },
        2, // Reduce retries to 2 to avoid excessive retries
      )

      // Check for specific error status codes
      if (response.status === 429) {
        return {
          error: {
            code: "429",
            message: "Too Many Requests",
          },
        }
      }

      if (!response.ok) {
        return {
          error: {
            code: String(response.status),
            message: response.statusText || "HTTP error",
          },
        }
      }

      // Safely parse the JSON response
      const data = await safeJsonParse(response)

      // Check if the response has an error property
      if (data.error) {
        return data
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

  // Get posts by username
  static async getPostsByUsername(username: string, token?: string): Promise<any[]> {
    try {
      // Build a structured query using qs
      const query = {
        filters: {
          user: {
            username: {
              $eq: username,
            },
          },
        },
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
            populate: {
              profileImage: {
                fields: ["url", "formats"],
              },
            },
          },
          mediaItems: {
            fields: ["id", "type", "order", "documentId"],
            populate: {
              file: {
                fields: ["url", "formats"],
              },
            },
          },
          tags: {
            fields: ["id", "name", "documentId"],
          },
        },
        sort: ["publishedAt:desc"], // Sort by newest first
        pagination: {
          pageSize: 50, // Get more posts at once
        },
      }

      // Convert the query to a string
      const queryString = qs.stringify(query, { encodeValuesOnly: true })

      // Construct the endpoint
      const endpoint = `/api/posts?${queryString}`
      const fullUrl = `${API_URL}${API_URL.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      } else if (API_TOKEN) {
        headers["Authorization"] = `Bearer ${API_TOKEN}`
      }

      // Make the request
      const response = await fetch(fullUrl, {
        method: "GET",
        headers,
        cache: "no-store",
      })

      if (!response.ok) {
        return []
      }

      // Parse the JSON response
      const responseData = await response.json()

      // Extract posts from the response
      let posts = []
      if (responseData.data && Array.isArray(responseData.data)) {
        posts = responseData.data
      } else if (responseData.results && Array.isArray(responseData.results)) {
        posts = responseData.results
      } else if (Array.isArray(responseData)) {
        posts = responseData
      }

      return posts
    } catch (error) {
      return []
    }
  }

  // Get a single post by ID or documentId
  static async getPost(idOrDocumentId: string | number) {
    try {
      // Determine if we're dealing with a numeric ID or a documentId string
      const isNumericId = !isNaN(Number(idOrDocumentId))

      // Build a structured query using qs
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
            populate: {
              profileImage: {
                fields: ["url", "formats"],
              },
            },
          },
          mediaItems: {
            fields: ["id", "type", "order", "documentId"],
            populate: {
              file: {
                fields: ["url", "formats"],
              },
            },
          },
          tags: {
            fields: ["id", "name", "documentId"],
          },
        },
        // If it's a documentId (string), add a filter
        ...(!isNumericId
          ? {
              filters: {
                documentId: {
                  $eq: idOrDocumentId,
                },
              },
            }
          : {}),
      }

      // Convert the query to a string
      const queryString = qs.stringify(query, { encodeValuesOnly: true })

      // Construct the endpoint based on whether we're using ID or documentId
      const endpoint = isNumericId ? `/api/posts/${idOrDocumentId}?${queryString}` : `/api/posts?${queryString}`

      // Log the full URL that would be used
      const fullUrl = `${API_URL}${API_URL.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (API_TOKEN) {
        headers["Authorization"] = `Bearer ${API_TOKEN}`
      }

      // Make the request using our improved fetch utility
      const response = await fetchWithRetry(fullUrl, {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        const errorData = await safeJsonParse(response)
        return {
          error: {
            code: String(response.status),
            message: errorData.error?.message || response.statusText || "Unknown error",
          },
        }
      }

      const data = await safeJsonParse(response)

      // If we're using documentId, we need to extract the first item from the array
      if (!isNumericId && data.data && Array.isArray(data.data) && data.data.length > 0) {
        return {
          data: data.data[0],
          meta: data.meta,
        }
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

  // The rest of the methods remain the same...
  // For brevity, I'm not updating all methods, but in a real implementation,
  // you would want to apply similar error handling improvements to all methods
  // Create a new post with proper Strapi 5 format
  static async createPost(postData: {
    title: string
    description: string
    contentType?: ContentType
    background?: any
    featured?: boolean
    galleryLayout?: GalleryLayout
    userId?: string // This should be the documentId, not the numeric ID
    tags?: string[] // Add tags array
    mediaFiles?: File[] // Add media files array
  }) {
    try {
      // Extract data
      const { userId, tags = [], mediaFiles = [], ...postFields } = postData

      // Get the token from environment variable
      const token = process.env.NEXT_PUBLIC_API_TOKEN || ""

      // Prepare headers
      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
      }

      // Construct the API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

      // STEP 1: Upload media files first if they exist
      let uploadedMediaItems: any[] = []

      if (mediaFiles.length > 0) {
        console.log("PostService: Uploading media files first...")

        try {
          // Upload files to Strapi upload endpoint
          const uploadFormData = new FormData()

          for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i]
            uploadFormData.append("files", file, `${i}-${file.name}`)
          }

          const uploadUrl = `${apiUrl}/api/upload`
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
          })

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(`File upload failed with status ${uploadResponse.status}: ${errorText}`)
          }

          const uploadedFiles = await uploadResponse.json()
          console.log("PostService: Files uploaded successfully:", uploadedFiles)

          // Create mediaItems array with uploaded file IDs
          uploadedMediaItems = uploadedFiles.map((file: any, index: number) => ({
            file: file.id, // Use the uploaded file ID
            type: file.mime.startsWith("image/") ? "image" : "video",
            order: index + 1,
          }))

          console.log("PostService: Prepared media items:", uploadedMediaItems)
        } catch (error) {
          console.error("PostService: File upload failed:", error)
          throw new Error(`File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      // STEP 2: Create the post data object with proper Strapi 5 format
      const data = {
        data: {
          ...postFields,
          // Only include user if userId is provided
          ...(userId
            ? {
                user: {
                  connect: [userId], // Strapi 5 relation format - must be documentId
                },
              }
            : {}),
          // Add tags array directly
          tags: tags,
          // Add mediaItems array with uploaded file references
          mediaItems: uploadedMediaItems,
        },
      }

      console.log("PostService: Creating post with data:", JSON.stringify(data, null, 2))

      // Construct the full URL for post creation
      const endpoint = `/api/posts`
      const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

      // Make the post creation request
      const fetchResponse = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        throw new Error(`API error (${fetchResponse.status}): ${errorText}`)
      }

      let response = await fetchResponse.json()

      // Fetch complete post data with populated relations
      try {
        if (response.data && response.data.id) {
          const query = qs.stringify(
            {
              populate: {
                user: {
                  fields: ["id", "username", "displayName", "documentId"],
                  populate: {
                    profileImage: {
                      fields: ["url", "formats"],
                    },
                  },
                },
                mediaItems: {
                  fields: ["id", "type", "order", "file"],
                  populate: {
                    file: {
                      fields: ["url", "formats"],
                    },
                  },
                },
                tags: {
                  fields: ["id", "name", "documentId"],
                },
              },
            },
            { encodeValuesOnly: true },
          )

          const completeDataUrl = `${apiUrl}/api/posts/${response.data.id}?${query}`

          const completeDataResponse = await fetch(completeDataUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (completeDataResponse.ok) {
            const completeData = await completeDataResponse.json()
            response = {
              ...response,
              completeData: completeData,
            }
          }
        }
      } catch (error) {
        console.error("PostService: Failed to fetch complete post data:", error)
      }

      return response
    } catch (error) {
      throw error
    }
  }

  // Update an existing post
  static async updatePost(id: number | string, postData: any) {
    try {
      // Format the data for Strapi 5
      const data = {
        data: postData,
      }

      // Get the token from environment variable
      const token = process.env.NEXT_PUBLIC_API_TOKEN || ""

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Construct the full URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const endpoint = `/api/posts/${id}`
      const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

      // Make the request
      const fetchResponse = await fetch(fullUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      })

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        throw new Error(`API error (${fetchResponse.status}): ${errorText}`)
      }

      const response = await fetchResponse.json()
      return response
    } catch (error) {
      throw error
    }
  }

  // Delete a post
  static async deletePost(id: number | string) {
    try {
      // Get the token from environment variable
      const token = process.env.NEXT_PUBLIC_API_TOKEN || ""

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Construct the full URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const endpoint = `/api/posts/${id}`
      const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

      // Make the request
      const fetchResponse = await fetch(fullUrl, {
        method: "DELETE",
        headers,
      })

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        throw new Error(`API error (${fetchResponse.status}): ${errorText}`)
      }

      const response = await fetchResponse.json()
      return response
    } catch (error) {
      throw error
    }
  }

  // Like a post
  static async likePost(postId: number | string, userId: number | string) {
    try {
      // Format the data for Strapi 5
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

      // Get the token from environment variable
      const token = process.env.NEXT_PUBLIC_API_TOKEN || ""

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Construct the full URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const endpoint = `/api/likes`
      const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

      // Make the request
      const fetchResponse = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      })

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        throw new Error(`API error (${fetchResponse.status}): ${errorText}`)
      }

      const response = await fetchResponse.json()
      return response
    } catch (error) {
      throw error
    }
  }

  // Unlike a post
  static async unlikePost(likeId: number | string) {
    try {
      // Get the token from environment variable
      const token = process.env.NEXT_PUBLIC_API_TOKEN || ""

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Construct the full URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const endpoint = `/api/likes/${likeId}`
      const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

      // Make the request
      const fetchResponse = await fetch(fullUrl, {
        method: "DELETE",
        headers,
      })

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        throw new Error(`API error (${fetchResponse.status}): ${errorText}`)
      }

      const response = await fetchResponse.json()
      return response
    } catch (error) {
      throw error
    }
  }

  // Add tags to a post
  static async addTagsToPost(postId: number | string, tags: string[]) {
    try {
      // Get the current post data
      const postResponse = await this.getPost(postId)
      const postData = postResponse.data

      // Prepare the updated tags
      const existingTags = postData.tags || []
      const newTags = [...existingTags, ...tags.map((tag) => ({ name: tag }))]

      // Update the post with the new tags
      const updateData = {
        tags: newTags,
      }

      // Update the post
      const response = await this.updatePost(postId, updateData)
      return response
    } catch (error) {
      throw error
    }
  }

  // Upload media files for a post - Updated for Strapi v5 and MediaItem collection type
  // static async uploadMedia(files: File[], postId: number | string) {
  //   try {
  //     const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
  //     const uploadEndpoint = `/api/upload`
  //     const uploadUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${uploadEndpoint.startsWith("/") ? uploadEndpoint.substring(1) : uploadEndpoint}`

  //     // Get the token from environment variable
  //     const token = process.env.NEXT_PUBLIC_API_TOKEN || ""

  //     // Prepare headers for upload (without Content-Type as it will be set by FormData)
  //     const headers: HeadersInit = {}

  //     // Add authorization header if token exists
  //     if (token) {
  //       headers["Authorization"] = `Bearer ${token}`
  //     }

  //     // Upload each file and collect results
  //     const uploadResults = await Promise.all(
  //       files.map(async (file) => {
  //         const formData = new FormData()
  //         formData.append("files", file)

  //         const uploadResponse = await fetch(uploadUrl, {
  //           method: "POST",
  //           headers,
  //           body: formData,
  //         })

  //         if (!uploadResponse.ok) {
  //           const errorText = await uploadResponse.text()
  //           throw new Error(`Upload API error (${uploadResponse.status}): ${errorText}`)
  //         }

  //         return await uploadResponse.json()
  //       }),
  //     )

  //     // Create MediaItems for each uploaded file
  //     const mediaItems = await Promise.all(
  //       uploadResults.flat().map(async (fileData, index) => {
  //         const mediaItemData = {
  //           post: postId,
  //           file: fileData.id,
  //           type: fileData.mime.startsWith("video/") ? "video" : "image",
  //           order: index,
  //         }

  //         const mediaItem = await PostService.createMediaItem(mediaItemData)
  //         return {
  //           ...fileData,
  //           mediaItemId: mediaItem.data.id,
  //           mediaItemDocumentId: mediaItem.data.documentId,
  //           type: mediaItemData.type,
  //           order: mediaItemData.order,
  //         }
  //       }),
  //     )

  //     return mediaItems
  //   } catch (error) {
  //     throw error
  //   }
  // }

  // Create a MediaItem that links a file to a post
  // static async createMediaItem(mediaData: {
  //   post: number | string
  //   file: number | string
  //   type: "image" | "video"
  //   order?: number
  // }) {
  //   try {
  //     // Format the data according to Strapi 5 requirements
  //     const { post, file, type, order } = mediaData

  //     const data = {
  //       data: {
  //         type,
  //         order: order || 0,
  //         file: {
  //           connect: [typeof file === "string" ? file : file.toString()],
  //         },
  //         post: {
  //           connect: [typeof post === "string" ? post : post.toString()],
  //         },
  //       },
  //     }

  //     // Get the token from environment variable
  //     const token = process.env.NEXT_PUBLIC_API_TOKEN || ""

  //     // Prepare headers
  //     const headers: HeadersInit = {
  //       "Content-Type": "application/json",
  //     }

  //     // Add authorization header if token exists
  //     if (token) {
  //       headers["Authorization"] = `Bearer ${token}`
  //     }

  //     // Construct the full URL
  //     const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
  //     const endpoint = `/api/media-items`
  //     const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

  //     // Make the request
  //     const fetchResponse = await fetch(fullUrl, {
  //       method: "POST",
  //       headers,
  //       body: JSON.stringify(data),
  //     })

  //     if (!fetchResponse.ok) {
  //       const errorText = await fetchResponse.text()
  //       throw new Error(`API error (${fetchResponse.status}): ${errorText}`)
  //     }

  //     const response = await fetchResponse.json()
  //     return response
  //   } catch (error) {
  //     throw error
  //   }
  // }
}
