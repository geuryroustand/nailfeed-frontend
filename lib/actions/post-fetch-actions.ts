"use server"

import qs from "qs"
import { cache } from "react"
import { PostService } from "@/lib/services/post-service"
import type { Post } from "@/lib/post-data"
import { normalizeImageUrl } from "@/lib/image-utils"

// Update the transformStrapiPost function to correctly handle the Strapi v5 response structure
// Replace the existing transformStrapiPost function with:

function transformStrapiPost(post: any): Post {
  try {
    console.log("[v0] Transforming post data:", JSON.stringify(post, null, 2))

    if (!post) {
      throw new Error("Post data is null or undefined")
    }

    if (!post.id) {
      throw new Error("Post ID is missing")
    }

    // Extract user data - handle both data.attributes structure and direct structure
    const user = post.user?.data ? post.user.data.attributes : post.user || {}
    console.log("[v0] User data extracted:", user)

    // Extract media items - handle both new media field and legacy mediaItems
    const mediaItems = post.media || post.mediaItems?.data || post.mediaItems || []
    console.log("[v0] Media items extracted:", mediaItems.length)

    // Extract tags - handle both data array and direct array
    const tags = post.tags?.data
      ? post.tags.data.map((tag: any) => tag.attributes?.name || tag.name || "")
      : post.tags
        ? post.tags.map((tag: any) => tag.name || "")
        : []
    console.log("[v0] Tags extracted:", tags)

    const likes = post.likes?.data || post.likes || []
    console.log("[v0] Processing likes with user data:", likes)

    const processedLikes = Array.isArray(likes)
      ? likes.map((entry: any, index: number) => {
          try {
            const likeData = entry.attributes || entry
            const likeUserData = likeData.user?.data ? likeData.user.data.attributes : likeData.user

            return {
              id: entry.id || likeData.id || likeData.documentId || `like-${index}`,
              documentId: likeData.documentId || entry.documentId || `like-${index}`,
              type: likeData.type || "like",
              createdAt: likeData.createdAt,
              user: likeUserData
                ? {
                    id: likeUserData.id || likeUserData.documentId,
                    documentId: likeUserData.documentId || likeUserData.id,
                    username: likeUserData.username,
                    displayName: likeUserData.displayName || likeUserData.username,
                    profileImage: likeUserData.profileImage?.data
                      ? likeUserData.profileImage.data.attributes
                      : likeUserData.profileImage,
                  }
                : null,
            }
          } catch (likeError) {
            console.error(`[v0] Error processing like entry ${index}:`, likeError)
            return null
          }
        }).filter(Boolean)
      : []

    const userReactionRaw = post.userReaction ?? null
    const userReactionType = typeof userReactionRaw === "string" ? userReactionRaw : userReactionRaw?.type ?? null

    // userSaved is calculated by backend when user is authenticated
    const userSaved = post.userSaved !== undefined ? post.userSaved : false

    // Get the first media item URL or use a placeholder
    let imageUrl = "/intricate-nail-art.png"

    if (mediaItems && mediaItems.length > 0) {
      try {
        // Handle different possible structures for media items
        const firstMedia = mediaItems[0].attributes || mediaItems[0]
        const fileData = firstMedia.file?.data?.attributes || firstMedia.file

        const mediaType = firstMedia.type || "image"

        if (mediaType === "video") {
          // For videos, use the direct URL without trying to access image formats
          if (fileData?.url) {
            imageUrl = normalizeImageUrl(fileData.url)
            console.log("[v0] Video URL extracted:", imageUrl)
          }
        } else {
          // For images, check all possible paths for the image URL
          if (fileData?.url) {
            imageUrl = normalizeImageUrl(fileData.url)
          } else if (fileData?.formats?.medium?.url) {
            imageUrl = normalizeImageUrl(fileData.formats.medium.url)
          } else if (fileData?.formats?.small?.url) {
            imageUrl = normalizeImageUrl(fileData.formats.small.url)
          } else if (fileData?.formats?.thumbnail?.url) {
            imageUrl = normalizeImageUrl(fileData.formats.thumbnail.url)
          }
          console.log("[v0] Image URL extracted:", imageUrl)
        }
      } catch (mediaError) {
        console.error("[v0] Error processing media items:", mediaError)
        // Keep default image URL
      }
    }

    // Get user profile image - handle different possible structures
    let userImageUrl = "/serene-woman-gaze.png"
    try {
      const profileImage = user.profileImage?.data?.attributes || user.profileImage

      if (profileImage?.url) {
        userImageUrl = normalizeImageUrl(profileImage.url)
      } else if (profileImage?.formats?.thumbnail?.url) {
        userImageUrl = normalizeImageUrl(profileImage.formats.thumbnail.url)
      }
      console.log("[v0] User image URL extracted:", userImageUrl)
    } catch (userImageError) {
      console.error("[v0] Error processing user image:", userImageError)
      // Keep default user image URL
    }

    // Format the timestamp
    const timestamp = post.publishedAt ? formatTimestamp(post.publishedAt) : "Recently"
    console.log("[v0] Timestamp formatted:", timestamp)

    // Process media items to ensure they have proper URLs
    const processedMediaItems = mediaItems.map((item: any, index: number) => {
      try {
        // Handle new direct media structure vs legacy mediaItems structure
        const itemData = item.attributes || item
        const fileData = itemData.file?.data?.attributes || itemData.file || item // Direct media has no file wrapper

        // Determine media type from mime or legacy type field
        const mediaType = item.mime?.startsWith('image/') ? 'image' :
                         item.mime?.startsWith('video/') ? 'video' :
                         itemData.type || "image"

        let url = ""

        if (mediaType === "video") {
          // For videos, use the direct URL
          if (item.url) { // Direct media structure
            url = normalizeImageUrl(item.url)
          } else if (fileData?.url) { // Legacy structure
            url = normalizeImageUrl(fileData.url)
          }
        } else {
          // For images, try different format sizes
          if (item.url) { // Direct media structure
            url = normalizeImageUrl(item.url)
          } else if (fileData?.url) { // Legacy structure
            url = normalizeImageUrl(fileData.url)
          } else if (item.formats?.medium?.url) { // Direct media formats
            url = normalizeImageUrl(item.formats.medium.url)
          } else if (fileData?.formats?.medium?.url) { // Legacy formats
            url = normalizeImageUrl(fileData.formats.medium.url)
          } else if (item.formats?.small?.url) {
            url = normalizeImageUrl(item.formats.small.url)
          } else if (fileData?.formats?.small?.url) {
            url = normalizeImageUrl(fileData.formats.small.url)
          } else if (item.formats?.thumbnail?.url) {
            url = normalizeImageUrl(item.formats.thumbnail.url)
          } else if (fileData?.formats?.thumbnail?.url) {
            url = normalizeImageUrl(fileData.formats.thumbnail.url)
          }
        }

        return {
          id: item.id || item.documentId || `media-${index}`,
          type: mediaType,
          url: url,
        }
      } catch (itemError) {
        console.error(`[v0] Error processing media item ${index}:`, itemError)
        return {
          id: `media-${index}`,
          type: "image",
          url: "/intricate-nail-art.png",
        }
      }
    })

    const totalLikesCount =
      typeof post.likesCount === "number"
        ? post.likesCount
        : Array.isArray(processedLikes)
          ? processedLikes.length
          : 0

    // Compute reaction summaries from likes data
    const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"]
    const reactionEmojis = {
      like: "👍",
      love: "❤️",
      haha: "😂",
      wow: "😮",
      sad: "😢",
      angry: "😡"
    }

    const reactionCounts = reactionTypes.reduce((acc, type) => {
      acc[type] = processedLikes.filter((like: any) => like.type === type).length
      return acc
    }, {} as Record<string, number>)

    const reactionSummaries = reactionTypes
      .filter(type => reactionCounts[type] > 0)
      .map(type => ({
        type,
        emoji: reactionEmojis[type as keyof typeof reactionEmojis] || "👍",
        label: type.charAt(0).toUpperCase() + type.slice(1),
        count: reactionCounts[type],
        users: processedLikes
          .filter((like: any) => like.type === type)
          .map((like: any) => like.user)
          .filter(Boolean)
      }))

    const transformedPost = {
      id: post.id,
      documentId: post.documentId || `post-${post.id}`,
      userId: user.id || null,
      username: user.username || "unknown",
      userImage: userImageUrl,
      image: imageUrl,
      title: post.title || "",
      description: post.description || "",
      likes: totalLikesCount,
      likesList: processedLikes as any,
      reactions: reactionSummaries,
      userReaction: userReactionType,
      userSaved,
      comments: [],
      timestamp,
      tags,
      media: processedMediaItems, // New media field for Strapi v5
      mediaItems: processedMediaItems, // Keep for backward compatibility
      contentType: post.contentType || "image",
      background: post.background || null,
      galleryLayout: post.galleryLayout || "grid",
    }

    return transformedPost
  } catch (error) {
    console.error("[v0] Error transforming post data:", error)
    console.error("[v0] Original post data:", JSON.stringify(post, null, 2))
    throw new Error(`Failed to transform post data: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function to format timestamp
function formatTimestamp(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 6) {
      return date.toLocaleDateString()
    } else if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else if (diffMins > 0) {
      return `${diffMins}m ago`
    } else {
      return "Just now"
    }
  } catch (error) {
    return "Recently"
  }
}

// Optimized function to fetch a post by ID using PostService
export const fetchPostById = cache(async (id: string | number): Promise<Post | null> => {
  try {
    console.log(`[v0] Fetching post with ID or documentId: ${id}`)

    const response = await PostService.getPost(id)

    if (!response) {
      console.error('[v0] PostService returned no response for post fetch')
      return null
    }

    const errorInfo = (response as any).error
    if (errorInfo) {
      console.error('[v0] API error while fetching post:', errorInfo)
      const message = typeof errorInfo?.message === 'string' ? errorInfo.message : 'Unknown error'
      throw new Error(`API error: ${message}`)
    }

    const rawData = (response as any).data
    if (!rawData) {
      console.warn('[v0] Post response did not include data:', response)
      return null
    }

    const entry = Array.isArray(rawData) ? rawData[0] : rawData
    if (!entry) {
      console.warn('[v0] Post entry missing in response:', response)
      return null
    }

    const flattenedEntry = entry.attributes
      ? {
          id: entry.id,
          documentId: entry.documentId ?? entry.attributes?.documentId,
          ...entry.attributes,
        }
      : entry

    if (!flattenedEntry.documentId && entry.documentId) {
      flattenedEntry.documentId = entry.documentId
    }

    return transformStrapiPost(flattenedEntry)
  } catch (error) {
    console.error(`[v0] Error fetching post ${id}:`, error)
    throw error
  }
})

// Function to fetch related posts based on tags
export const fetchRelatedPosts = cache(async (postId: string | number, tags: string[], limit = 4): Promise<Post[]> => {
  try {
    if (!tags || tags.length === 0) {
      return []
    }

    // Build a structured query using qs - revised for Strapi v5 compatibility
    const query = {
      filters: {
        id: {
          $ne: postId, // Not equal to current post
        },
        tags: {
          name: {
            $in: tags, // Posts with any of the same tags
          },
        },
      },
      populate: {
        user: {
          populate: {
            profileImage: {
              fields: ["url", "formats"],
            },
          },
        },
        mediaItems: {
          populate: {
            file: {
              fields: ["url", "formats"],
            },
          },
        },
        tags: true,
      },
      pagination: {
        limit,
      },
      sort: ["publishedAt:desc"],
    }

    // Convert the query to a string
    const queryString = qs.stringify(query, { encodeValuesOnly: true })

    // Construct the endpoint
    const endpoint = `/api/posts?${queryString}`

    // Get the token from environment variable
    const token = process.env.API_TOKEN || ""

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Construct the full URL
    const apiUrl = process.env.API_URL || "https://nailfeed-backend-production.up.railway.app"
    const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    // Make the request with AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const fetchResponse = await fetch(fullUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      })

      clearTimeout(timeoutId)

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text()
        console.error(`[v0] API error (${fetchResponse.status}): ${errorText}`)
        return [] // Return empty array on error
      }

      const response = await fetchResponse.json()

      // Transform the API response to our Post interface
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((item: any) => {
          const postData = item.attributes || item
          return transformStrapiPost({
            id: item.id,
            ...postData,
          })
        })
      }

      return []
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        console.error(`[v0] Request timeout for related posts`)
        return [] // Return empty array on timeout
      }

      throw error
    }
  } catch (error) {
    console.error(`[v0] Error fetching related posts:`, error)
    return []
  }
})

// New function to fetch post and related posts in a single function to avoid multiple requests
export const fetchPostWithRelated = cache(
  async (idOrDocumentId: string | number): Promise<{ post: Post | null; relatedPosts: Post[] }> => {
    try {
      // First fetch the post
      const post = await fetchPostById(idOrDocumentId)

      if (!post) {
        return { post: null, relatedPosts: [] }
      }

      // Then fetch related posts if the post has tags
      let relatedPosts: Post[] = []
      if (post.tags && post.tags.length > 0) {
        relatedPosts = await fetchRelatedPosts(post.id, post.tags, 4)
      }

      // Track post view (non-blocking)
      trackPostView(post.id).catch((error) => {
        console.error(`Error tracking post view: ${error}`)
      })

      return { post, relatedPosts }
    } catch (error) {
      console.error(`Error in fetchPostWithRelated for ${idOrDocumentId}:`, error)
      throw error
    }
  },
)

// Function to track post views (non-blocking)
async function trackPostView(postId: number | string): Promise<void> {
  // Skip tracking in development
  if (process.env.NODE_ENV === "development") {
    return
  }

  try {
    const apiUrl = process.env.API_URL || "https://nailfeed-backend-production.up.railway.app"
    const endpoint = `/api/analytics/view`
    const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    // Fire and forget - don't await the response
    fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN || ""}`,
      },
      body: JSON.stringify({
        postId,
        source: "web",
      }),
    }).catch((error) => {
      // Silently log errors but don't propagate them
      console.error(`Error tracking view for post ${postId}:`, error)
    })
  } catch (error) {
    // Silently log errors but don't propagate them
    console.error(`Error tracking view for post ${postId}:`, error)
  }
}
