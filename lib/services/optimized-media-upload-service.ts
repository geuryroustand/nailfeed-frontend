"use client"

import { normalizeImageUrl } from "@/lib/image-utils"
import type { CommentAttachment } from "@/lib/services/comments-service"

/**
 * Optimized Media Upload Service using Strapi v5 native upload capabilities
 * This service implements the optimized flow documented in the backend docs
 */
export class OptimizedMediaUploadService {
  private static UPLOAD_ENDPOINT = "/api/auth-proxy/upload?endpoint=/api/upload"

  /**
   * Upload media files directly to a post using Strapi v5 ref/refId/field parameters
   * This creates the media relations automatically without backend processing
   */
  static async uploadMediaToPost(
    files: File[],
    postDocumentId: string
  ): Promise<any[]> {
    if (!files.length || !postDocumentId) {
      throw new Error("Files and post document ID are required")
    }

    console.log(`OptimizedMediaUploadService: Uploading ${files.length} files to post ${postDocumentId}`)

    const formData = new FormData()

    // Add files
    files.forEach((file, index) => {
      formData.append("files", file, `${index}-${file.name}`)
    })

    // Strapi v5 relation parameters for direct media attachment
    formData.append("ref", "api::post.post")
    formData.append("refId", postDocumentId)
    formData.append("field", "media") // Direct media field (not mediaItems)

    try {
      const response = await fetch(this.UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(
          `Failed to upload media to post (status ${response.status}): ${errorText || response.statusText}`
        )
      }

      const uploadedFiles = await response.json()
      console.log("OptimizedMediaUploadService: Upload successful:", uploadedFiles)

      return Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]
    } catch (error) {
      console.error("OptimizedMediaUploadService: Upload failed:", error)
      throw error
    }
  }

  /**
   * Upload image without associating it to any specific content
   * Returns the uploaded file data including documentId for later use
   */
  static async uploadGenericImage(file: File): Promise<{ id: string; url: string } | null> {
    if (!(file instanceof File)) {
      throw new Error("uploadGenericImage: file must be a File instance")
    }

    const formData = new FormData()
    formData.append("files", file)

    const response = await fetch(this.UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(
        `Failed to upload image (status ${response.status}): ${errorText || response.statusText}`,
      )
    }

    const payload = await response.json().catch(() => null)
    const fileData = Array.isArray(payload)
      ? payload[0]
      : payload?.data && Array.isArray(payload.data)
        ? payload.data[0]
        : Array.isArray(payload?.files)
          ? payload.files[0]
          : payload

    if (!fileData) {
      return null
    }

    return {
      id: fileData.documentId || String(fileData.id),
      url: normalizeImageUrl(fileData.url)
    }
  }

  /**
   * Upload image to comment using Strapi v5 approach
   * Maintains compatibility with existing comment image functionality
   */
  static async uploadCommentImage(
    commentId: number,
    file: File,
  ): Promise<CommentAttachment | null> {
    if (!commentId || Number.isNaN(commentId)) {
      throw new Error("uploadCommentImage: commentId must be a valid number")
    }

    if (!(file instanceof File)) {
      throw new Error("uploadCommentImage: file must be a File instance")
    }

    const formData = new FormData()
    formData.append("files", file)
    formData.append("ref", "api::comment.comment")
    formData.append("refId", String(commentId))
    formData.append("field", "image")

    const response = await fetch(this.UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(
        `Failed to upload comment image (status ${response.status}): ${errorText || response.statusText}`,
      )
    }

    const payload = await response.json().catch(() => null)
    const fileData = Array.isArray(payload)
      ? payload[0]
      : payload?.data && Array.isArray(payload.data)
        ? payload.data[0]
        : Array.isArray(payload?.files)
          ? payload.files[0]
          : payload

    if (!fileData) {
      return null
    }

    const primaryUrl = fileData.url
    const fallbackUrl =
      fileData.formats?.medium?.url ||
      fileData.formats?.small?.url ||
      fileData.formats?.thumbnail?.url ||
      primaryUrl

    if (!fallbackUrl) {
      return null
    }

    return {
      id: String(fileData.documentId || fileData.id || commentId),
      url: normalizeImageUrl(fallbackUrl || ""),
      formats: fileData.formats,
    }
  }

  /**
   * Upload files without relations (for standalone uploads)
   * Useful for profile images, general uploads, etc.
   */
  static async uploadFiles(files: File[]): Promise<any[]> {
    console.log(`OptimizedMediaUploadService: Uploading ${files.length} standalone files`)

    const formData = new FormData()

    files.forEach((file, index) => {
      formData.append("files", file, `${index}-${file.name}`)
    })

    try {
      const response = await fetch(this.UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("OptimizedMediaUploadService: Standalone upload successful:", result)
      return Array.isArray(result) ? result : [result]
    } catch (error) {
      console.error("OptimizedMediaUploadService: Standalone upload failed:", error)
      throw error
    }
  }

  /**
   * Retry upload with exponential backoff
   * Useful for handling temporary network issues
   */
  static async uploadWithRetry(
    uploadFunction: () => Promise<any[]>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any[]> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await uploadFunction()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === maxRetries) {
          break
        }

        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`OptimizedMediaUploadService: Retry attempt ${attempt} failed, retrying in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error("Upload failed after retries")
  }

  /**
   * Validate files before upload
   * Returns valid files and error messages for invalid ones
   */
  static validateFiles(files: File[], options: {
    maxFileSize?: number // in bytes
    allowedTypes?: string[]
    maxFiles?: number
  } = {}): {
    validFiles: File[]
    errors: string[]
  } {
    const {
      maxFileSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
      maxFiles = 10
    } = options

    const validFiles: File[] = []
    const errors: string[] = []

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return { validFiles: [], errors }
    }

    for (const file of files) {
      if (file.size > maxFileSize) {
        errors.push(`File "${file.name}" exceeds maximum size of ${Math.round(maxFileSize / 1024 / 1024)}MB`)
        continue
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push(`File "${file.name}" has unsupported type: ${file.type}`)
        continue
      }

      validFiles.push(file)
    }

    return { validFiles, errors }
  }
}
