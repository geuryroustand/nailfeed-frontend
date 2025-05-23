import { fetchWithRetry } from "@/lib/fetch-with-retry"
import type { ExplorePost, PaginatedResponse } from "@/lib/explore-data"
import qs from "qs"

// Get environment variables
const API_URL = process.env.API_URL || ""
const API_TOKEN = process.env.API_TOKEN || ""

/**
 * Service for fetching explore-related data from the API
 */
export const ExploreService = {
  /**
   * Fetch paginated explore posts from the API
   */
  async getExplorePosts(limit = 12, page = 1): Promise<PaginatedResponse<ExplorePost>> {
    try {
      // Construct query using qs package
      const query = qs.stringify({
        fields: [
          "id",
          "documentId",
          "description",
          "contentType",
          "galleryLayout",
          "publishedAt",
          "likesCount",
          "commentsCount",
          "title",
        ],
        populate: {
          user: {
            fields: ["id", "username", "displayName", "documentId"],
            populate: {
              profileImage: {
                fields: ["url", "formats"],
              },
            },
          },
          mediaItems: {
            fields: ["id", "type", "order", "documentId"],
            populate: {
              file: {
                fields: ["url", "formats"],
              },
            },
          },
          tags: {
            fields: ["id", "name", "documentId"],
          },
        },
        pagination: {
          page,
          pageSize: limit,
        },
        sort: ["publishedAt:desc"],
      })

      // Construct the full API URL
      const apiUrl = `${API_URL}/api/posts?${query}`

      console.log("Fetching explore posts from:", apiUrl)

      // Make the request
      const response = await fetchWithRetry(
        apiUrl,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
          },
          // Add cache: 'no-store' to prevent caching issues
          cache: "no-store",
        },
        2,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}):`, errorText)
        throw new Error(`Failed to fetch explore posts: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Check if data has the expected structure
      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error("Unexpected API response structure:", data)
        throw new Error("Unexpected API response structure")
      }

      // Transform the response to match our app's expected format
      const transformedData = {
        data: data.data.map((post: any) => {
          // Get the first media item for the main image
          let imageUrl = "/intricate-nail-art.png"
          let imageFormats = null

          if (post.attributes?.mediaItems?.data && post.attributes.mediaItems.data.length > 0) {
            const mediaItem = post.attributes.mediaItems.data[0]
            if (mediaItem.attributes?.file?.data?.attributes) {
              const file = mediaItem.attributes.file.data.attributes
              // Use medium format if available, otherwise use the original URL
              imageFormats = file.formats || {}
              const mediumUrl = file.formats?.medium?.url || file.url
              // Ensure the URL is absolute
              imageUrl = mediumUrl.startsWith("http") ? mediumUrl : `${API_URL}${mediumUrl}`
            }
          }

          // Get user profile image
          let userImageUrl = "/diverse-user-avatars.png"
          let username = "unknown"
          let displayName = "unknown"

          if (post.attributes?.user?.data?.attributes) {
            const user = post.attributes.user.data.attributes
            username = user.username || "unknown"
            displayName = user.displayName || user.username || "unknown"

            if (user.profileImage?.data?.attributes) {
              const profileImage = user.profileImage.data.attributes
              const profileImageUrl = profileImage.formats?.thumbnail?.url || profileImage.url
              userImageUrl = profileImageUrl.startsWith("http") ? profileImageUrl : `${API_URL}${profileImageUrl}`
            }
          }

          return {
            id: post.id,
            documentId: post.attributes?.documentId || post.id.toString(),
            image: imageUrl,
            imageFormats: imageFormats,
            likes: post.attributes?.likesCount || 0,
            comments: post.attributes?.commentsCount || 0,
            username: username,
            displayName: displayName,
            userImage: userImageUrl,
            description: post.attributes?.description || "",
            title: post.attributes?.title || "",
            contentType: post.attributes?.contentType || "media-gallery",
            galleryLayout: post.attributes?.galleryLayout || "grid",
            tags: post.attributes?.tags?.data
              ? post.attributes.tags.data.map((tag: any) => tag.attributes?.name || "")
              : [],
            createdAt: post.attributes?.publishedAt || post.attributes?.createdAt,
            // Store all media items for carousel/grid layouts
            mediaItems: post.attributes?.mediaItems?.data
              ? post.attributes.mediaItems.data.map((item: any) => {
                  if (!item.attributes?.file?.data?.attributes) {
                    return {
                      id: item.id,
                      documentId: item.attributes?.documentId || item.id.toString(),
                      type: item.attributes?.type || "image",
                      order: item.attributes?.order || 0,
                      url: "/intricate-nail-art.png",
                      formats: {},
                    }
                  }

                  const file = item.attributes.file.data.attributes
                  const fileUrl = file.url || ""
                  return {
                    id: item.id,
                    documentId: item.attributes.documentId || item.id.toString(),
                    type: item.attributes.type || "image",
                    order: item.attributes.order || 0,
                    url: fileUrl.startsWith("http") ? fileUrl : `${API_URL}${fileUrl}`,
                    formats: Object.entries(file.formats || {}).reduce((acc: any, [key, format]: [string, any]) => {
                      acc[key] = {
                        ...format,
                        url: format.url.startsWith("http") ? format.url : `${API_URL}${format.url}`,
                      }
                      return acc
                    }, {}),
                  }
                })
              : [],
          }
        }),
        nextCursor:
          data.meta?.pagination?.page < data.meta?.pagination?.pageCount ? String(data.meta.pagination.page + 1) : null,
        hasMore: data.meta?.pagination?.page < data.meta?.pagination?.pageCount,
      }

      return transformedData
    } catch (error) {
      console.error("Error fetching explore posts:", error)
      // Return empty data on error
      return {
        data: [],
        nextCursor: null,
        hasMore: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }
    }
  },

  /**
   * Get user's liked and saved posts
   */
  async getUserInteractions(userId: string): Promise<{
    likedPostIds: number[]
    savedPostIds: number[]
  }> {
    try {
      // Construct the API URL for user interactions
      const apiUrl = `${API_URL}/api/users/${userId}/interactions`

      const response = await fetchWithRetry(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
        },
        cache: "no-store",
      })

      if (!response.ok) {
        return {
          likedPostIds: [],
          savedPostIds: [],
        }
      }

      const data = await response.json()

      return {
        likedPostIds: data.likedPosts?.map((post: any) => post.id) || [],
        savedPostIds: data.savedPosts?.map((post: any) => post.id) || [],
      }
    } catch (error) {
      console.error("Error fetching user interactions:", error)
      return {
        likedPostIds: [],
        savedPostIds: [],
      }
    }
  },

  /**
   * Fetch comments for a specific post
   */
  async getPostComments(postId: number) {
    try {
      // Construct query using qs
      const query = qs.stringify({
        fields: ["id", "content", "createdAt"],
        populate: {
          user: {
            fields: ["id", "username", "displayName"],
            populate: {
              profileImage: {
                fields: ["url", "formats"],
              },
            },
          },
        },
        sort: ["createdAt:desc"],
      })

      const apiUrl = `${API_URL}/api/posts/${postId}/comments?${query}`

      const response = await fetchWithRetry(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch post comments: ${response.status}`)
      }

      const data = await response.json()

      // Transform the response to match our app's expected format
      return (data.data || []).map((comment: any) => {
        let userImageUrl = "/diverse-user-avatars.png"
        if (comment.user?.profileImage?.url) {
          const profileImageUrl = comment.user.profileImage.formats?.thumbnail?.url || comment.user.profileImage.url
          userImageUrl = profileImageUrl.startsWith("http") ? profileImageUrl : `${API_URL}${profileImageUrl}`
        }

        return {
          id: comment.id,
          postId,
          username: comment.user?.username || "unknown",
          displayName: comment.user?.displayName || comment.user?.username || "unknown",
          userImage: userImageUrl,
          text: comment.content || "",
          createdAt: comment.createdAt,
        }
      })
    } catch (error) {
      console.error("Error fetching post comments:", error)
      return []
    }
  },
}
