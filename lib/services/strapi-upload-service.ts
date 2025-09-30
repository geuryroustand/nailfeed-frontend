/**
 * Simple Strapi upload service following official documentation
 * https://docs.strapi.io/cms/api/rest/upload
 */

export interface UploadedFile {
  id: number
  name: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  formats?: any
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl?: string
  provider: string
  provider_metadata?: any
  createdAt: string
  updatedAt: string
}

export interface UploadResult {
  success: boolean
  files?: UploadedFile[]
  error?: string
}

/**
 * Upload files with post references following backend optimized flow
 * Uses ref/refId/field parameters for automatic Strapi relations
 *
 * @param files - Files to upload
 * @param postId - Post numeric ID for Strapi relations (not documentId)
 * @returns Upload result with file data
 */
export async function uploadFilesToPost(
  files: File[],
  postId: string | number
): Promise<UploadResult> {
  try {
    console.log(`[StrapiUpload] Uploading ${files.length} files to post ID ${postId}`)

    const formData = new FormData()

    // Add files with 'files' key as per Strapi documentation
    files.forEach((file, index) => {
      formData.append('files', file)
    })

    // Add Strapi reference parameters (CRITICAL: use numeric ID, not documentId)
    formData.append('refId', postId.toString())      // Post numeric ID (not documentId!)
    formData.append('ref', 'api::post.post')         // Content type UID
    formData.append('field', 'media')                // Field name in schema

    console.log(`[StrapiUpload] Upload params:`, {
      refId: postId.toString(),
      ref: 'api::post.post',
      field: 'media',
      filesCount: files.length
    })

    // Use auth-proxy endpoint to handle authentication
    const uploadUrl = '/api/auth-proxy/upload?endpoint=/api/upload'

    console.log(`[StrapiUpload] Uploading to: ${uploadUrl}`)

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[StrapiUpload] Upload failed:`, errorText)
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
    }

    const responseData = await response.json()
    console.log(`[StrapiUpload] Raw response:`, responseData)

    // Handle different response formats from Strapi
    let uploadedFiles: UploadedFile[]

    if (Array.isArray(responseData)) {
      uploadedFiles = responseData
    } else if (responseData.data && Array.isArray(responseData.data)) {
      uploadedFiles = responseData.data
    } else if (responseData.files && Array.isArray(responseData.files)) {
      uploadedFiles = responseData.files
    } else {
      // Backend returns custom message instead of file data
      // This means upload was successful but we need to handle it differently
      console.log(`[StrapiUpload] Upload successful but non-standard response:`, responseData)

      // Return empty array since upload was successful but no file data returned
      uploadedFiles = []
    }

    if (uploadedFiles.length > 0) {
      console.log(`[StrapiUpload] Successfully uploaded ${uploadedFiles.length} files:`,
        uploadedFiles.map(f => ({ id: f.id, name: f.name, url: f.url }))
      )
    } else {
      console.log(`[StrapiUpload] Upload completed but no file data returned from backend`)
    }

    return {
      success: true,
      files: uploadedFiles
    }

  } catch (error) {
    console.error('[StrapiUpload] Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}

/**
 * Upload media to existing post following optimized backend flow
 * This is the primary function for the new workflow
 *
 * @param files - Files to upload
 * @param postId - Post numeric ID for Strapi relations
 * @returns Upload result
 */
export async function uploadPostMedia(files: File[], postId: string | number): Promise<UploadResult> {
  return uploadFilesToPost(files, postId)
}
