/**
 * Utility functions for handling images
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

/**
 * Normalizes an image URL by ensuring it has the correct base URL
 * @param url The image URL to normalize
 * @returns The normalized URL
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return ""

  // If it's a blob URL, return it as is
  if (url.startsWith("blob:")) {
    return url
  }

  // If it's already an absolute URL, return it as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  // Special case for uploads directory - always prepend API base URL
  if (url.startsWith("/uploads/")) {
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    return `${baseUrl}${url}`
  }

  // If it's a local path (starts with / but not //), check if it's a public asset or an API path
  if (url.startsWith("/") && !url.startsWith("//")) {
    // Check if it's a public asset (in the public directory)
    if (isLocalAssetPath(url)) {
      // For local assets, just return the path as is
      return url
    }

    // For API paths, prepend the API base URL
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    return `${baseUrl}${url}`
  }

  // If it doesn't start with a slash, add one and prepend the API base URL
  return `${API_BASE_URL}/${url}`
}

/**
 * Gets the best available image URL from a formats object
 * @param formats The formats object from a media item
 * @returns The best available image URL or null if no formats are available
 */
export function getImageFormat(formats: any): string | null {
  if (!formats) return null

  // Prioritize medium format, then small, then large, then thumbnail
  const formatUrl = formats.medium?.url || formats.small?.url || formats.large?.url || formats.thumbnail?.url

  return formatUrl ? normalizeImageUrl(formatUrl) : null
}

/**
 * Extracts the URL from a media item object
 * @param mediaItem The media item object
 * @returns The extracted URL or null if no URL is found
 */
export function extractMediaUrl(mediaItem: any): string | null {
  if (!mediaItem) return null

  // If it's a string, assume it's already a URL
  if (typeof mediaItem === "string") {
    return normalizeImageUrl(mediaItem)
  }

  // Handle the specific structure from the JSON data
  // Where mediaItem has a file property with formats
  if (mediaItem.file && mediaItem.file.formats) {
    const formats = mediaItem.file.formats
    // Prioritize medium format, then small, then large, then thumbnail
    const formatUrl = formats.medium?.url || formats.small?.url || formats.large?.url || formats.thumbnail?.url

    return formatUrl ? normalizeImageUrl(formatUrl) : null
  }

  // If the file has a direct URL
  if (mediaItem.file && mediaItem.file.url) {
    return normalizeImageUrl(mediaItem.file.url)
  }

  // If it has a direct URL property
  if (mediaItem.url) {
    return normalizeImageUrl(mediaItem.url)
  }

  // If it has direct formats
  if (mediaItem.formats) {
    const formats = mediaItem.formats
    const formatUrl = formats.medium?.url || formats.small?.url || formats.large?.url || formats.thumbnail?.url
    return formatUrl ? normalizeImageUrl(formatUrl) : null
  }

  // Handle Strapi v4/v5 data structure
  if (mediaItem.data && typeof mediaItem.data === "object") {
    if (mediaItem.data.attributes && mediaItem.data.attributes.url) {
      return normalizeImageUrl(mediaItem.data.attributes.url)
    }

    if (Array.isArray(mediaItem.data) && mediaItem.data.length > 0) {
      const firstItem = mediaItem.data[0]
      if (firstItem.attributes && firstItem.attributes.url) {
        return normalizeImageUrl(firstItem.attributes.url)
      }
    }
  }

  // Handle attributes directly (Strapi v4/v5)
  if (mediaItem.attributes && mediaItem.attributes.url) {
    return normalizeImageUrl(mediaItem.attributes.url)
  }

  return null
}

/**
 * Checks if a URL is a local asset path
 * @param url The URL to check
 * @returns True if the URL is a local asset path
 */
export function isLocalAssetPath(url: string): boolean {
  if (!url) return false

  // Blob URLs are not local asset paths
  if (url.startsWith("blob:")) return false

  // Check if it's a local path (starts with / but not //)
  if (!url.startsWith("/") || url.startsWith("//")) return false

  // Known API paths that should NOT be treated as local assets
  if (url.startsWith("/uploads/")) return false
  if (url.startsWith("/api/")) return false

  // Check if it's a public asset (starts with /public/ or has a common image extension)
  return (
    url.startsWith("/public/") ||
    /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url) ||
    // Add paths to known local directories
    url.startsWith("/images/") ||
    url.startsWith("/assets/")
  )
}

/**
 * Checks if a URL is an API path
 * @param url The URL to check
 * @returns True if the URL is an API path
 */
export function isApiPath(url: string): boolean {
  if (!url) return false

  // Blob URLs are not API paths
  if (url.startsWith("blob:")) return false

  // Check if it's a path (starts with / but not //)
  if (!url.startsWith("/") || url.startsWith("//")) return false

  // Known API paths
  return url.startsWith("/uploads/") || url.startsWith("/api/")
}

/**
 * Gets the absolute URL for an image
 * @param url The image URL
 * @returns The absolute URL
 */
export function getAbsoluteImageUrl(url: string): string {
  if (!url) return ""

  // If it's a blob URL, return it as is
  if (url.startsWith("blob:")) {
    return url
  }

  // If it's already an absolute URL, return it as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  // If it's an API path, prepend the API base URL
  if (isApiPath(url)) {
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    return `${baseUrl}${url}`
  }

  // If it's a local asset path, return it as is
  if (isLocalAssetPath(url)) {
    return url
  }

  // For other paths, prepend the API base URL
  return `${API_BASE_URL}/${url}`
}

/**
 * Debug function to log the structure of a media item
 * @param mediaItem The media item to debug
 */
export function debugMediaItem(mediaItem: any): void {
  console.group("Media Item Debug")
  console.log("Media Item:", mediaItem)

  if (mediaItem?.file) {
    console.log("File:", mediaItem.file)
    console.log("File URL:", mediaItem.file.url)

    if (mediaItem.file.formats) {
      console.log("Formats:", mediaItem.file.formats)
      console.log("Medium URL:", mediaItem.file.formats.medium?.url)
      console.log("Small URL:", mediaItem.file.formats.small?.url)
      console.log("Large URL:", mediaItem.file.formats.large?.url)
      console.log("Thumbnail URL:", mediaItem.file.formats.thumbnail?.url)

      // Log the normalized URLs
      if (mediaItem.file.formats.medium?.url) {
        console.log("Normalized Medium URL:", normalizeImageUrl(mediaItem.file.formats.medium.url))
      }
    }
  }

  console.log("Extracted URL:", extractMediaUrl(mediaItem))
  console.groupEnd()
}

/**
 * Debug function to log image URL information
 * @param url The image URL to debug
 * @param context Optional context for debugging
 */
export function debugImageUrl(url: string, context?: string): void {
  console.group(`Image URL Debug${context ? ` - ${context}` : ""}`)
  console.log("Original URL:", url)
  console.log("Is Local Asset:", isLocalAssetPath(url))
  console.log("Is API Path:", isApiPath(url))
  console.log("Normalized URL:", normalizeImageUrl(url))
  console.log("Absolute URL:", getAbsoluteImageUrl(url))
  console.groupEnd()
}

/**
 * Forces an API base URL for a given path
 * @param path The path to prepend with API base URL
 * @returns The full API URL
 */
export function forceApiBaseUrl(path: string): string {
  const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

/**
 * Gets the current API base URL
 * @returns The current API base URL
 */
export function getCurrentApiBaseUrl(): string {
  return API_BASE_URL
}
