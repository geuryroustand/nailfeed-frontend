/**
 * Client-side service for uploading files to Strapi backend
 * Moves upload logic from Server Action to client to avoid 1MB limit
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
 * Upload multiple files to Strapi via auth-proxy
 * @param files - Array of File objects to upload
 * @returns Promise with upload result
 */
export async function uploadFiles(files: File[]): Promise<UploadResult> {
  try {
    console.log(`[ClientUpload] Starting upload of ${files.length} files`)

    // Create FormData with all files
    const formData = new FormData()

    files.forEach((file, index) => {
      // Use Strapi format: append each file with 'files' key
      formData.append('files', file, `${index}-${file.name}`)
    })

    // Upload to auth-proxy endpoint which forwards to Strapi
    const uploadUrl = '/api/auth-proxy/upload?endpoint=/api/upload'

    console.log(`[ClientUpload] Uploading to: ${uploadUrl}`)

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData, // Don't set Content-Type, let browser set multipart boundary
    })

    console.log(`[ClientUpload] Upload response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[ClientUpload] Upload failed:`, errorText)
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
    }

    const uploadedFiles: UploadedFile[] = await response.json()

    console.log(`[ClientUpload] Successfully uploaded ${uploadedFiles.length} files:`,
      uploadedFiles.map(f => ({ id: f.id, name: f.name, url: f.url }))
    )

    return {
      success: true,
      files: uploadedFiles
    }

  } catch (error) {
    console.error('[ClientUpload] Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}

/**
 * Prepare media items from uploaded files for post creation
 * @param uploadedFiles - Files returned from uploadFiles()
 * @returns Array of media items ready for post data
 */
export function prepareMediaItems(uploadedFiles: UploadedFile[]) {
  return uploadedFiles.map((file, index) => ({
    id: file.id,
    file: file, // Complete file object
    type: file.mime.startsWith('image/') ? 'image' : 'video',
    url: file.url, // Direct URL
    order: index + 1,
  }))
}