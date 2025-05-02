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

  // Handle relative URLs
  if (url.startsWith("/")) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
    // Remove trailing slash from API URL to prevent double slashes
    const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl
    return `${baseUrl}${url}`
  }

  // Fix double slashes in URLs (but preserve protocol slashes)
  if (url.includes("//")) {
    // Don't replace protocol double slashes
    const parts = url.split("://")
    if (parts.length > 1) {
      const protocol = parts[0]
      const rest = parts[1].replace(/\/+/g, "/")
      return `${protocol}://${rest}`
    }
  }

  return url
}

/**
 * Gets the best available image URL from a media item with formats
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

  // If it has a direct URL property
  if (mediaItem.url) {
    return normalizeImageUrl(mediaItem.url)
  }

  // If it has a file property with formats
  if (mediaItem.file && mediaItem.file.formats) {
    const formats = mediaItem.file.formats
    const formatUrl = formats.medium?.url || formats.small?.url || formats.large?.url || formats.thumbnail?.url
    return formatUrl ? normalizeImageUrl(formatUrl) : null
  }

  // If it has direct formats
  if (mediaItem.formats) {
    const formats = mediaItem.formats
    const formatUrl = formats.medium?.url || formats.small?.url || formats.large?.url || formats.thumbnail?.url
    return formatUrl ? normalizeImageUrl(formatUrl) : null
  }

  return null
}
