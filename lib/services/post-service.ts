"use client"

import { apiClient } from "@/lib/api-client"

export type ContentType = "image" | "video" | "text" | "text-background" | "media-gallery"
export type GalleryLayout = "grid," | "carousel," | "featured"

export class PostService {
  // Helper function to construct full URLs for media items
  private static getFullUrl(relativePath: string): string {
    if (!relativePath) return ""
    if (relativePath.startsWith("http")) return relativePath

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
    return `${apiUrl}${relativePath.startsWith("/") ? "" : "/"}${relativePath}`
  }

  // Get posts with pagination
  static async getPosts(page = 1, pageSize = 10) {
    try {
      console.log(`PostService: Fetching posts page ${page} with pageSize ${pageSize}`)

      // Construct the endpoint with specific populate parameters
      const endpoint = `/api/posts?pagination[page]=${page}&populate[mediaItems][populate][file][fields][0]=formats&populate[user][fields][0]=username&populate[user][fields][1]=displayName&populate[user][populate][profileImage][fields][0]=formats&pagination[pageSize]=${pageSize}`

      // Log the full URL that will be used
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`
      console.log(`PostService: Full URL: ${fullUrl}`)

      // Get the token if available
      const token = process.env.NEXT_PUBLIC_APP_ENV || ""
      console.log(`PostService: Using token: ${token ? "exists" : "not found"}`)

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Make the request directly to ensure proper URL construction
      const fetchResponse = await fetch(fullUrl, {
        method: "GET",
        headers,
        cache: "no-store",
      })

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        console.error(`PostService: API error (${fetchResponse.status}): ${errorText}`)
        throw new Error(`API error (${fetchResponse.status}): ${errorText}`)
      }

      const response = await fetchResponse.json()

      // Validate response structure
      if (!response || !response.data) {
        console.error("PostService: Invalid response structure:", response)
        throw new Error("Invalid API response structure")
      }

      // Add a debug log to inspect the media items structure
      if (response.data && response.data.length > 0 && response.data[0].mediaItems) {
        console.log(
          "PostService: First post media items structure:",
          JSON.stringify(response.data[0].mediaItems[0], null, 2),
        )
      }

      console.log(`PostService: Successfully fetched ${Array.isArray(response.data) ? response.data.length : 0} posts`)
      return response
    } catch (error) {
      console.error("PostService: Error fetching posts:", error)
      throw error
    }
  }

  // Get a single post by ID
  static async getPost(id: number | string) {
    try {
      console.log(`PostService: Fetching post ${id}`)
      // Update the single post endpoint to use the same populate structure
      const endpoint = `/api/posts/${id}?populate[mediaItems][populate][file][fields][0]=formats&populate[user][fields][0]=username&populate[user][fields][1]=displayName&populate[user][populate][profileImage][fields][0]=formats`
      const response = await apiClient.get(endpoint)
      return response
    } catch (error) {
      console.error(`PostService: Error fetching post ${id}:`, error)
      throw error
    }
  }

  // Create a new post with proper Strapi 5 format
  static async createPost(postData: {
    title: string
    description: string
    contentType?: ContentType
    background?: any
    featured?: boolean
    galleryLayout?: GalleryLayout
    userId?: string // This should be the documentId, not the numeric ID
  }) {
    console.log("PostService: Creating post with data:", JSON.stringify(postData, null, 2))

    try {
      // Extract userId from postData
      const { userId, ...postFields } = postData

      // Create the post data object with proper Strapi 5 format
      const data = {
        data: {
          ...postFields,
          // Only include user if userId is provided
          ...(userId
            ? {
                user: {
                  connect: [userId], // Strapi 5 relation format
                },
              }
            : {}),
          // Ensure the post is published immediately
          publishedAt: new Date().toISOString(),
        },
      }

      console.log("PostService: Sending post creation request with data:", JSON.stringify(data, null, 2))

      // Construct the URL directly
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl
      const endpoint = "/api/posts"
      const fullUrl = `${baseUrl}${endpoint}`

      console.log(`PostService: Creating post at URL: ${fullUrl}`)

      // Get the token
      const token = process.env.NEXT_PUBLIC_APP_ENV || ""

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Make the request directly
      const fetchResponse = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      })

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        console.error(`PostService: Post creation failed with status ${fetchResponse.status}:`, errorText)
        throw new Error(`Post creation failed with status ${fetchResponse.status}: ${errorText}`)
      }

      const response = await fetchResponse.json()
      console.log("PostService: Post creation response:", response)
      return response
    } catch (error) {
      console.error("PostService: Error creating post:", error)
      throw error
    }
  }

  // Update an existing post
  static async updatePost(id: number | string, postData: any) {
    try {
      console.log(`PostService: Updating post ${id} with data:`, JSON.stringify(postData, null, 2))

      // For Strapi 5, we need to wrap the data in a data object
      const wrappedData = { data: postData }

      // Make the request directly to ensure proper URL construction
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl
      const endpoint = `/api/posts/${id}`
      const fullUrl = `${baseUrl}${endpoint}`

      console.log(`PostService: Updating post at URL: ${fullUrl}`)

      // Get the token
      const token = process.env.NEXT_PUBLIC_APP_ENV || ""

      // Prepare headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Make the request directly
      const fetchResponse = await fetch(fullUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(wrappedData),
      })

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        console.error(`PostService: Post update failed with status ${fetchResponse.status}:`, errorText)
        throw new Error(`Post update failed with status ${fetchResponse.status}: ${errorText}`)
      }

      const response = await fetchResponse.json()
      return response
    } catch (error) {
      console.error(`PostService: Error updating post ${id}:`, error)
      throw error
    }
  }

  // Delete a post
  static async deletePost(id: number | string) {
    try {
      console.log(`PostService: Deleting post ${id}`)
      const response = await apiClient.delete(`/api/posts/${id}`)
      return response
    } catch (error) {
      console.error(`PostService: Error deleting post ${id}:`, error)
      throw error
    }
  }

  // Like a post
  static async likePost(postId: number | string, userId: number | string) {
    try {
      console.log(`PostService: Liking post ${postId} by user ${userId}`)
      const response = await apiClient.post(`/api/likes`, {
        data: {
          post: {
            connect: [postId.toString()],
          },
          user: {
            connect: [userId.toString()],
          },
        },
      })
      return response
    } catch (error) {
      console.error(`PostService: Error liking post ${postId}:`, error)
      throw error
    }
  }

  // Unlike a post
  static async unlikePost(likeId: number | string) {
    try {
      console.log(`PostService: Unliking post with like ID ${likeId}`)
      const response = await apiClient.delete(`/api/likes/${likeId}`)
      return response
    } catch (error) {
      console.error(`PostService: Error unliking post with like ID ${likeId}:`, error)
      throw error
    }
  }

  // Add tags to a post
  static async addTagsToPost(postId: number | string, tags: string[], token?: string) {
    try {
      console.log(`PostService: Adding ${tags.length} tags to post ${postId}`)

      // Implement proper tag connection for Strapi 5
      const response = await apiClient.put(`/api/posts/${postId}`, {
        data: {
          tags: {
            connect: tags.map((tag) => tag.toString()),
          },
        },
      })

      console.log(`PostService: Tags added successfully:`, response)
      return response
    } catch (error) {
      console.error(`PostService: Error adding tags to post ${postId}:`, error)
      throw error
    }
  }

  // Upload media files for a post - Updated for Strapi v5
  static async uploadMedia(files: File[], postId: number | string, token?: string) {
    try {
      console.log(`PostService: Uploading ${files.length} media files for post ${postId}`)

      // In Strapi v5, we need to first upload the files, then attach them to the post
      const results = []

      // Step 1: Upload each file individually
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`PostService: Uploading file ${i + 1}/${files.length}: ${file.name}`)

        const formData = new FormData()
        formData.append("files", file)

        // Construct the upload URL directly to avoid any issues
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
        // Remove trailing slash if it exists
        const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl
        const uploadUrl = `${baseUrl}/api/upload`

        console.log(`PostService: Upload URL: ${uploadUrl}`)

        // Get the token if not provided
        const authToken = token || process.env.NEXT_PUBLIC_APP_ENV || ""

        // Prepare headers
        const headers: HeadersInit = {}

        // Add authorization header if token exists
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`
        }

        // Upload the file directly
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers,
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error(`PostService: File upload failed with status ${uploadResponse.status}:`, errorText)
          throw new Error(`File upload failed with status ${uploadResponse.status}: ${errorText}`)
        }

        const uploadedFiles = await uploadResponse.json()
        console.log(`PostService: File ${i + 1} uploaded successfully:`, uploadedFiles)

        results.push(...uploadedFiles)
      }

      // Step 2: Attach the uploaded files to the post
      if (results.length > 0) {
        console.log(`PostService: Attaching ${results.length} files to post ${postId}`)

        // Get the IDs of the uploaded files - use numeric IDs directly
        const fileIds = results.map((file) => file.id)
        console.log(`PostService: Using numeric IDs for media items:`, fileIds)

        // For media fields in Strapi 5, we need to use direct assignment, not connect
        // Try to get the document ID for the post if it's a numeric ID
        let targetPostId = postId
        if (!isNaN(Number(postId))) {
          try {
            // Fetch the post to get its document ID
            const postDetails = await this.getPost(postId)
            if (postDetails && postDetails.data && postDetails.data.documentId) {
              targetPostId = postDetails.data.documentId
              console.log(`PostService: Using document ID ${targetPostId} for media attachment`)
            }
          } catch (error) {
            console.error(`PostService: Error fetching post document ID:`, error)
            // Continue with the original ID if we can't get the document ID
          }
        }

        await this.updatePost(targetPostId, {
          mediaItems: fileIds,
        })

        console.log(`PostService: Successfully attached ${results.length} files to post ${postId}`)
      }

      return results
    } catch (error) {
      console.error("PostService: Error uploading media:", error)
      throw error
    }
  }

  // Get document IDs for media items
  static async getMediaDocumentIds(mediaIds: number[], token?: string): Promise<string[]> {
    try {
      const documentIds: string[] = []

      // For each media ID, fetch the full media object to get its document ID
      for (const id of mediaIds) {
        const endpoint = `https://nailfeed-backend-production.up.railway.app/api/upload/files/${id}`

        // Set up headers
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        console.log(`PostService: Fetching media item ${id} to get document ID`)

        // Make the request
        const response = await fetch(endpoint, {
          method: "GET",
          headers,
        })

        if (!response.ok) {
          console.error(`PostService: Failed to fetch media item ${id}`)
          // If we can't get the document ID, use the string representation of the numeric ID
          documentIds.push(id.toString())
          continue
        }

        const mediaItem = await response.json()

        // Check if the media item has a document ID
        if (mediaItem && mediaItem.documentId) {
          console.log(`PostService: Found document ID ${mediaItem.documentId} for media item ${id}`)
          documentIds.push(mediaItem.documentId)
        } else {
          // If no document ID is found, use the string representation of the numeric ID
          console.log(`PostService: No document ID found for media item ${id}, using numeric ID`)
          documentIds.push(id.toString())
        }
      }

      return documentIds
    } catch (error) {
      console.error("PostService: Error getting media document IDs:", error)
      // If there's an error, return the string representations of the numeric IDs
      return mediaIds.map((id) => id.toString())
    }
  }

  // Add a new method to create media items linked to a post
  static async createMediaItem(mediaData: {
    post: number | string
    media: number | string
    type: string
    order?: number
  }) {
    console.log("PostService: Creating media item with data:", JSON.stringify(mediaData, null, 2))

    try {
      // Format the data according to Strapi 5 requirements
      const { post, media, ...otherFields } = mediaData

      const data = {
        data: {
          ...otherFields,
          post: {
            connect: [post.toString()],
          },
          media: {
            connect: [media.toString()],
          },
        },
      }

      const response = await apiClient.post("/api/media-items", data)
      console.log("PostService: Media item creation response:", response)
      return response
    } catch (error) {
      console.error("PostService: Error creating media item:", error)
      throw error
    }
  }
}
