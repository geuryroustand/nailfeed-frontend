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
 * Validates files before upload
 */
function validateFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

  if (files.length === 0) {
    errors.push('No files selected')
    return { valid: false, errors }
  }

  for (const file of files) {
    if (file.size > maxSize) {
      errors.push(`File "${file.name}" exceeds 10MB limit`)
    }
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File "${file.name}" has unsupported type: ${file.type}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Upload multiple files to Strapi via auth-proxy with retry logic and timeout
 * @param files - Array of File objects to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadFiles(
  files: File[],
  options: {
    timeout?: number
    maxRetries?: number
    retryDelay?: number
  } = {}
): Promise<UploadResult> {
  const {
    timeout = 60000, // 60 seconds
    maxRetries = 3,
    retryDelay = 1000 // 1 second
  } = options

  // Validate files first
  const validation = validateFiles(files)
  if (!validation.valid) {
    return {
      success: false,
      error: `File validation failed: ${validation.errors.join(', ')}`
    }
  }

  console.log(`[ClientUpload] Starting upload of ${files.length} files with retry logic`)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ClientUpload] Attempt ${attempt}/${maxRetries}`)

      // Create FormData with all files
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append('files', file, `${index}-${file.name}`)
      })

      // Upload to auth-proxy endpoint which forwards to Strapi
      const uploadUrl = '/api/auth-proxy/upload?endpoint=/api/upload'

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, timeout)

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log(`[ClientUpload] Upload response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[ClientUpload] Upload failed on attempt ${attempt}:`, errorText)

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Upload failed: ${errorText}`)
        }

        // Retry on server errors (5xx) or network issues
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
          console.log(`[ClientUpload] Retrying in ${delay}ms...`)
          await sleep(delay)
          continue
        }

        throw new Error(`Upload failed after ${maxRetries} attempts: ${errorText}`)
      }

      const uploadedFiles: UploadedFile[] = await response.json()

      console.log(`[ClientUpload] Successfully uploaded ${uploadedFiles.length} files on attempt ${attempt}:`,
        uploadedFiles.map(f => ({ id: f.id, name: f.name, url: f.url }))
      )

      return {
        success: true,
        files: uploadedFiles
      }

    } catch (error) {
      console.error(`[ClientUpload] Upload error on attempt ${attempt}:`, error)

      // Handle timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < maxRetries) {
          console.log(`[ClientUpload] Timeout occurred, retrying...`)
          await sleep(retryDelay * attempt)
          continue
        }
        return {
          success: false,
          error: `Upload timed out after ${timeout/1000} seconds`
        }
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < maxRetries) {
          console.log(`[ClientUpload] Network error, retrying...`)
          await sleep(retryDelay * attempt)
          continue
        }
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        }
      }

      // Don't retry on other errors
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  return {
    success: false,
    error: `Upload failed after ${maxRetries} attempts`
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
