import { getApiUrl, ensureAbsoluteUrl, getImageUrl, getThumbnailUrl } from "@/lib/api-url-helper"

/**
 * Interface for processed image data
 */
export interface ProcessedImage {
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  alt?: string
}

/**
 * Process an image object from the API to extract all relevant information
 *
 * @param imageObj The image object from the API
 * @param defaultAlt Optional default alt text
 * @returns Processed image data with absolute URLs
 */
export function processApiImage(imageObj: any, defaultAlt?: string): ProcessedImage | null {
  if (!imageObj) return null

  console.log("Processing image object:", JSON.stringify(imageObj))

  const apiUrl = getApiUrl()

  // Get the main image URL
  let url = getImageUrl(imageObj)

  // If no URL found, try to extract from formats
  if (!url && imageObj.formats) {
    // Try formats in order of preference
    const formatPreference = ["large", "medium", "small", "thumbnail"]

    for (const format of formatPreference) {
      if (imageObj.formats[format] && imageObj.formats[format].url) {
        url = ensureAbsoluteUrl(imageObj.formats[format].url)
        console.log(`Using ${format} format URL: ${url}`)
        break
      }
    }
  }

  if (!url) {
    console.log("No valid image URL found")
    return null
  }

  // Get thumbnail if available
  let thumbnailUrl = getThumbnailUrl(imageObj)

  // If no thumbnail but we have formats, use the smallest format as thumbnail
  if (!thumbnailUrl && imageObj.formats) {
    if (imageObj.formats.thumbnail && imageObj.formats.thumbnail.url) {
      thumbnailUrl = ensureAbsoluteUrl(imageObj.formats.thumbnail.url)
    } else if (imageObj.formats.small && imageObj.formats.small.url) {
      thumbnailUrl = ensureAbsoluteUrl(imageObj.formats.small.url)
    }
  }

  // Extract dimensions if available
  const width = imageObj.width || undefined
  const height = imageObj.height || undefined

  // Extract alt text if available
  const alt = imageObj.alternativeText || imageObj.caption || defaultAlt || ""

  return {
    url,
    thumbnailUrl: thumbnailUrl || undefined,
    width,
    height,
    alt,
  }
}

/**
 * Get the best image URL to use based on available formats
 *
 * @param imageObj The image object from the API
 * @param preferredSize The preferred size ('thumbnail', 'small', 'medium', or 'large')
 * @returns The absolute URL to the best image
 */
export function getBestImageUrl(imageObj: any, preferredSize?: "thumbnail" | "small" | "medium" | "large"): string {
  if (!imageObj) return ""

  // If no preferred size, return the main URL
  if (!preferredSize) return getImageUrl(imageObj)

  // Check if the preferred format exists
  if (imageObj.formats && imageObj.formats[preferredSize] && imageObj.formats[preferredSize].url) {
    return ensureAbsoluteUrl(imageObj.formats[preferredSize].url)
  }

  // Fallback to main URL
  return getImageUrl(imageObj)
}
