/**
 * Simple upload service that mimics the original working approach
 * but moves the upload logic to client to avoid 1MB Server Action limit
 */

export interface SimpleUploadResult {
  success: boolean
  error?: string
}

/**
 * Upload files directly to the working endpoint
 * Uses same format as original working implementation
 */
export async function uploadMediaFiles(files: File[]): Promise<SimpleUploadResult> {
  try {
    console.log(`[SimpleUpload] Uploading ${files.length} files using working endpoint`)

    const formData = new FormData()

    // Use exact same format as the working implementation
    files.forEach((file, index) => {
      formData.append('files', file, `${index}-${file.name}`)
    })

    // Use auth-proxy to forward to Strapi upload endpoint (same as working version)
    const uploadUrl = '/api/auth-proxy/upload?endpoint=/api/upload'

    console.log(`[SimpleUpload] Uploading to: ${uploadUrl}`)

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    console.log(`[SimpleUpload] Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[SimpleUpload] Upload failed:`, errorText)
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
    }

    // Don't try to parse response - just return success
    // The backend will handle the media relations
    console.log(`[SimpleUpload] Upload completed successfully`)

    return {
      success: true
    }

  } catch (error) {
    console.error('[SimpleUpload] Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}
