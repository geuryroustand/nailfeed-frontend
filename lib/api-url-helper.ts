/**
 * Helper functions for handling API URLs
 */

/**
 * Get the base API URL from environment variables
 */
export function getApiUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

/**
 * Ensure a URL is absolute by prepending the API base URL if needed
 *
 * @param url The URL to process
 * @param baseUrl Optional base URL (defaults to API URL)
 * @returns Absolute URL
 */
export function ensureAbsoluteUrl(url: string, baseUrl?: string): string {
  if (!url) return ""

  try {
    // If already absolute, return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }

    // Use provided baseUrl or get from environment
    const apiBaseUrl = baseUrl || getApiUrl()

    // Handle URLs that start with a slash
    const absoluteUrl = url.startsWith("/") ? `${apiBaseUrl}${url}` : `${apiBaseUrl}/${url}`

    return absoluteUrl
  } catch (error) {
    console.error("Error in ensureAbsoluteUrl:", error)
    return url || ""
  }
}

/**
 * Process an image object from the API to get the best available URL
 *
 * @param imageObj The image object from the API
 * @returns The absolute URL to the image
 */
export function getImageUrl(imageObj: any): string {
  if (!imageObj) return ""

  try {
    // Try to get the URL from various possible locations in the object
    const imageUrl =
      imageObj.url ||
      (imageObj.data && imageObj.data.attributes && imageObj.data.attributes.url) ||
      (imageObj.formats && imageObj.formats.thumbnail && imageObj.formats.thumbnail.url)

    if (!imageUrl) return ""

    // Ensure the URL is absolute
    return ensureAbsoluteUrl(imageUrl)
  } catch (error) {
    console.error("Error in getImageUrl:", error)
    return ""
  }
}

/**
 * Get the thumbnail URL from an image object if available
 *
 * @param imageObj The image object from the API
 * @returns The absolute URL to the thumbnail or null if not available
 */
export function getThumbnailUrl(imageObj: any): string | null {
  if (!imageObj) return null

  try {
    // Try to get the thumbnail URL from formats
    if (imageObj.formats && imageObj.formats.thumbnail && imageObj.formats.thumbnail.url) {
      return ensureAbsoluteUrl(imageObj.formats.thumbnail.url)
    }

    // If no thumbnail format, fall back to the main URL
    return imageObj.url ? ensureAbsoluteUrl(imageObj.url) : null
  } catch (error) {
    console.error("Error in getThumbnailUrl:", error)
    return null
  }
}

/**
 * Extract and process profile image URL from user data
 *
 * @param user User data object
 * @returns Absolute URL to the profile image or null
 */
export function getProfileImageUrl(user: any): string | null {
  if (!user) return null

  try {
    // Handle the direct URL case
    if (user.profileImage?.url) {
      return ensureAbsoluteUrl(user.profileImage.url)
    }

    // Try avatar field as fallback
    if (user.avatar) {
      return ensureAbsoluteUrl(user.avatar)
    }

    return null
  } catch (error) {
    console.error("Error in getProfileImageUrl:", error)
    return null
  }
}

/**
 * Extract and process cover image URL from user data
 *
 * @param user User data object
 * @returns Absolute URL to the cover image or null
 */
export function getCoverImageUrl(user: any): string | null {
  if (!user) return null

  try {
    // Handle the direct URL case
    if (user.coverImage?.url) {
      return ensureAbsoluteUrl(user.coverImage.url)
    }

    return null
  } catch (error) {
    console.error("Error in getCoverImageUrl:", error)
    return null
  }
}

/**
 * Extract the best available image URL from a Strapi image object
 *
 * @param imageObj The image object from the API
 * @returns The best available image URL or null
 */
export function extractImageUrl(imageObj: any): string | null {
  if (!imageObj) return null

  try {
    // Try to get the main URL
    if (imageObj.url) {
      return ensureAbsoluteUrl(imageObj.url)
    }

    // Try to get from formats, starting with the largest available
    if (imageObj.formats) {
      // Try formats in order of preference
      const formatPreference = ["large", "medium", "small", "thumbnail"]

      for (const format of formatPreference) {
        if (imageObj.formats[format] && imageObj.formats[format].url) {
          return ensureAbsoluteUrl(imageObj.formats[format].url)
        }
      }
    }

    // Try to get from data.attributes if available (Strapi v4 structure)
    if (imageObj.data && imageObj.data.attributes) {
      const attrs = imageObj.data.attributes

      if (attrs.url) {
        return ensureAbsoluteUrl(attrs.url)
      }

      // Try formats in data.attributes
      if (attrs.formats) {
        const formatPreference = ["large", "medium", "small", "thumbnail"]

        for (const format of formatPreference) {
          if (attrs.formats[format] && attrs.formats[format].url) {
            return ensureAbsoluteUrl(attrs.formats[format].url)
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error in extractImageUrl:", error)
    return null
  }
}

/**
 * Get the best available image URL from a media item
 *
 * @param mediaItem The media item object from the API
 * @returns The best available image URL
 */
export function getMediaItemUrl(mediaItem: any): string {
  if (!mediaItem || !mediaItem.file) return ""

  try {
    // If formats are available, try to get the best size
    if (mediaItem.file.formats) {
      const url =
        mediaItem.file.formats.medium?.url ||
        mediaItem.file.formats.small?.url ||
        mediaItem.file.formats.thumbnail?.url ||
        mediaItem.file.url

      return url ? ensureAbsoluteUrl(url) : ""
    }

    // If no formats, use the main URL
    return mediaItem.file.url ? ensureAbsoluteUrl(mediaItem.file.url) : ""
  } catch (error) {
    console.error("Error in getMediaItemUrl:", error)
    return ""
  }
}
