"use client"

/**
 * Service for handling media uploads with the production endpoint
 */
export class MediaUploadService {
  // Production endpoint for uploads - hardcoded to ensure consistency
  private static UPLOAD_ENDPOINT = "https://nailfeed-backend-production.up.railway.app/api/upload"

  /**
   * Uploads files to the production endpoint
   */
  static async uploadFiles(files: File[], token?: string): Promise<any[]> {
    console.log(`MediaUploadService: Uploading ${files.length} files to ${this.UPLOAD_ENDPOINT}`)

    try {
      return await this.uploadFilesToEndpoint(files, token)
    } catch (error) {
      console.error("MediaUploadService: Upload failed:", error)
      throw error
    }
  }

  /**
   * Upload files to the specified endpoint
   */
  private static async uploadFilesToEndpoint(files: File[], token?: string): Promise<any[]> {
    // Create FormData for the upload
    const formData = new FormData()

    // Append each file to the FormData
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i])
    }

    // Log the request details
    console.log(`MediaUploadService: Sending POST request to ${this.UPLOAD_ENDPOINT}`)
    console.log(`MediaUploadService: Using token: ${token ? "Yes" : "No"}`)
    console.log(
      `MediaUploadService: Uploading ${files.length} files:`,
      files.map((f) => `${f.name} (${f.type}, ${f.size} bytes)`),
    )

    // Set up headers - only include Authorization if token is provided
    const headers: HeadersInit = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Make the request
    const response = await fetch(this.UPLOAD_ENDPOINT, {
      method: "POST",
      headers,
      body: formData,
    })

    // Log the response status
    console.log(`MediaUploadService: Response status: ${response.status}`)

    // Handle errors
    if (!response.ok) {
      let errorText = ""
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = "Could not read error response"
      }

      console.error(`MediaUploadService: Upload failed with status ${response.status}:`, errorText)
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
    }

    // Parse and return the response
    const result = await response.json()
    console.log("MediaUploadService: Upload successful:", result)
    return result
  }

  /**
   * Creates a single media item for an uploaded file
   * Extracted as a separate function for parallel processing
   */
  private static async createSingleMediaItem(
    fileId: number,
    postId: number | string,
    postDocumentId: string | undefined,
    order: number,
    token?: string,
  ): Promise<any> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
    const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${baseUrl}/api/media-items`

    // Set up headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    try {
      // For many-to-one relations, use direct assignment with documentId if available
      const requestBody = {
        data: {
          file: fileId,
          type: "image",
          order,
          post: postDocumentId ? { documentId: postDocumentId } : postId,
        },
      }

      console.log(`MediaUploadService: Creating media item for file ${fileId}:`, JSON.stringify(requestBody, null, 2))

      // Make the request
      let response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      })

      // Handle errors and try alternative approaches
      if (!response.ok) {
        console.log(`MediaUploadService: First attempt failed with status ${response.status}`)

        // Try approach 2: Using ID object
        const approach2Body = {
          data: {
            file: fileId,
            type: "image",
            order,
            post: { id: postId },
          },
        }

        console.log(`MediaUploadService: Trying approach 2:`, JSON.stringify(approach2Body, null, 2))

        response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(approach2Body),
        })

        if (!response.ok && postDocumentId) {
          console.log(`MediaUploadService: Approach 2 failed with status ${response.status}`)

          // Try approach 3: Using document ID directly
          const approach3Body = {
            data: {
              file: fileId,
              type: "image",
              order,
              post: postDocumentId,
            },
          }

          console.log(`MediaUploadService: Trying approach 3:`, JSON.stringify(approach3Body, null, 2))

          response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(approach3Body),
          })
        }
      }

      if (!response.ok) {
        console.error(`MediaUploadService: All approaches failed for file ${fileId}`)
        const errorText = await response.text()
        console.error(`MediaUploadService: Last error:`, errorText)
        throw new Error(`Failed to create media item for file ${fileId}: ${errorText}`)
      }

      const result = await response.json()
      console.log(`MediaUploadService: Created media item for file ${fileId}:`, result)

      // Extract both the media item ID and documentId from the response
      let mediaItemId, mediaItemDocumentId

      if (result.data) {
        mediaItemId = result.data.id
        mediaItemDocumentId = result.data.documentId || result.data.attributes?.documentId
      } else if (result.id) {
        mediaItemId = result.id
        mediaItemDocumentId = result.documentId
      }

      if (mediaItemId) {
        console.log(
          `MediaUploadService: Extracted media item ID: ${mediaItemId}, documentId: ${mediaItemDocumentId || "Not found"}`,
        )
        return {
          id: mediaItemId,
          documentId: mediaItemDocumentId,
        }
      } else {
        console.error(`MediaUploadService: Could not extract media item ID from response`)
        throw new Error(`Could not extract media item ID from response for file ${fileId}`)
      }
    } catch (error) {
      console.error(`MediaUploadService: Error creating media item for file ${fileId}:`, error)
      throw error
    }
  }

  /**
   * Creates media item entries for uploaded files in parallel
   * For many-to-one relations, we use direct assignment for the post field
   */
  static async createMediaItems(
    fileIds: number[],
    postId: number | string,
    postDocumentId?: string,
    token?: string,
  ): Promise<any[]> {
    console.log(`MediaUploadService: Creating ${fileIds.length} media items for post ${postId}`)
    if (postDocumentId) {
      console.log(`MediaUploadService: Post document ID: ${postDocumentId}`)
    }

    // Create media items in parallel using Promise.all
    try {
      const mediaItemPromises = fileIds.map((fileId, index) =>
        this.createSingleMediaItem(fileId, postId, postDocumentId, index, token).catch((error) => {
          console.error(`MediaUploadService: Error creating media item for file ${fileId}:`, error)
          return null // Return null for failed items so we can filter them out
        }),
      )

      const mediaItems = await Promise.all(mediaItemPromises)

      // Filter out any null results from failed media item creations
      const successfulMediaItems = mediaItems.filter((item) => item !== null)

      console.log(
        `MediaUploadService: Successfully created ${successfulMediaItems.length} out of ${fileIds.length} media items`,
      )
      return successfulMediaItems
    } catch (error) {
      console.error(`MediaUploadService: Error creating media items:`, error)
      throw error
    }
  }

  /**
   * This method is kept for backward compatibility but is no longer needed
   * since the relationship is established when creating media items
   */
  static async updatePostWithMediaItems(
    mediaItems: { id: number | string; documentId?: string }[],
    postId: number | string,
    documentId: string,
    token?: string,
  ): Promise<any> {
    console.log(`MediaUploadService: updatePostWithMediaItems is deprecated and no longer needed`)
    console.log(`MediaUploadService: The relationship is already established when creating media items`)
    return { success: true, message: "Relationship already established" }
  }
}
