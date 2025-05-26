/**
 * Utility function to extract image URL from post data
 */

export interface PostImageData {
  id?: string
  imageUrl?: string
  image?: string
  media?: Array<{ url: string; formats?: any }>
  images?: string[]
  file?: {
    url?: string
    formats?: any
  }
  // Add other possible image properties
  [key: string]: any
}

/**
 * Extracts the best available image URL from post data
 * @param post The post object containing image data
 * @returns The best available image URL or a fallback
 */
export function extractPostImageUrl(post: PostImageData | null | undefined): string {
  if (!post) {
    console.warn("extractPostImageUrl - No post data provided")
    return "/placeholder.svg?height=400&width=400&text=No+Image"
  }

  console.log("extractPostImageUrl - Extracting from post:", {
    postId: post.id,
    imageUrl: post.imageUrl,
    image: post.image,
    media: post.media,
    images: post.images,
    file: post.file,
  })

  // Try different image sources in order of preference
  const possibleSources = [
    // Direct image URL properties
    post.imageUrl,
    post.image,

    // Media array (first item)
    post.media?.[0]?.url,
    post.media?.[0]?.formats?.medium?.url,
    post.media?.[0]?.formats?.small?.url,
    post.media?.[0]?.formats?.large?.url,

    // Images array (first item)
    post.images?.[0],

    // File object
    post.file?.url,
    post.file?.formats?.medium?.url,
    post.file?.formats?.small?.url,

    // Other possible properties
    post.thumbnail,
    post.cover,
    post.featuredImage,
  ]

  // Filter out falsy values and find the first valid URL
  const validUrls = possibleSources.filter((url): url is string => {
    return typeof url === "string" && url.trim().length > 0 && url !== "undefined" && url !== "null"
  })

  console.log("extractPostImageUrl - Valid URLs found:", validUrls)

  if (validUrls.length === 0) {
    console.warn("extractPostImageUrl - No valid image URLs found, using fallback")
    return "/placeholder.svg?height=400&width=400&text=No+Image+Available"
  }

  const selectedUrl = validUrls[0]
  console.log("extractPostImageUrl - Selected URL:", selectedUrl)

  return selectedUrl
}

/**
 * Validates if an image URL is accessible
 * @param url The image URL to validate
 * @returns Promise that resolves to true if image is accessible
 */
export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || url.includes("placeholder.svg")) {
      resolve(false)
      return
    }

    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.crossOrigin = "anonymous"
    img.src = url
  })
}

/**
 * Gets a validated image URL with fallback
 * @param post The post object
 * @returns Promise that resolves to a valid image URL
 */
export async function getValidatedImageUrl(post: PostImageData | null | undefined): Promise<string> {
  const extractedUrl = extractPostImageUrl(post)

  if (extractedUrl.includes("placeholder.svg")) {
    return extractedUrl
  }

  const isValid = await validateImageUrl(extractedUrl)

  if (isValid) {
    return extractedUrl
  }

  console.warn("getValidatedImageUrl - Image validation failed for:", extractedUrl)
  return "/placeholder.svg?height=400&width=400&text=Image+Not+Available"
}
