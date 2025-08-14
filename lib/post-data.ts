import { PostService } from "./services/post-service"
import { normalizeImageUrl } from "./image-utils"

export type PostComment = {
  id: number
  username: string
  text: string
  likes: number
  reactions: {
    [key: string]: {
      emoji: string
      count: number
      reacted: boolean
    }
  }
}

export type Post = {
  id: number
  documentId?: string
  userId?: string | number | null
  userDocumentId?: string
  username: string
  userImage: string
  image?: string
  title?: string
  description: string
  likes: any[] // Updated type to array
  comments: PostComment[]
  timestamp: string
  tags: string[]
  mediaItems?: any[]
  contentType?: string
  galleryLayout?: string
}

export type PaginatedPostsResponse = {
  posts: Post[]
  nextCursor: number | null
  hasMore: boolean
}

export type PostsResponse = {
  posts: Post[]
  hasMore: boolean
  nextPage?: number
  error?: {
    code: number | string
    message: string
  }
}

// Function to transform Strapi post data to our Post interface
function transformStrapiPost(post: any): Post {
  if (!post) {
    console.error("Received null or undefined post data")
    throw new Error("Invalid post data received")
  }

  try {
    // Extract user data
    const user = post.user || {}

    // Extract the user's documentId
    const userDocumentId = user.documentId || null

    // Extract media items
    const mediaItems = post.mediaItems || []

    // Extract tags
    const tags = post.tags ? post.tags.map((tag: any) => tag.name) : []

    const likes = post.likes || []

    // Get the first media item URL or use a placeholder
    let imageUrl = "/intricate-nail-art.png"

    if (mediaItems && mediaItems.length > 0) {
      const firstMedia = mediaItems[0]

      // Check all possible paths for the image URL
      if (firstMedia.file?.url) {
        imageUrl = normalizeImageUrl(firstMedia.file.url)
      } else if (firstMedia.file?.formats?.medium?.url) {
        imageUrl = normalizeImageUrl(firstMedia.file.formats.medium.url)
      } else if (firstMedia.file?.formats?.small?.url) {
        imageUrl = normalizeImageUrl(firstMedia.file.formats.small.url)
      } else if (firstMedia.file?.formats?.thumbnail?.url) {
        imageUrl = normalizeImageUrl(firstMedia.file.formats.thumbnail.url)
      }
    }

    // Get user profile image
    let userImageUrl = "/serene-woman-gaze.png"
    if (user.profileImage?.url) {
      userImageUrl = normalizeImageUrl(user.profileImage.url)
    } else if (user.profileImage?.formats?.thumbnail?.url) {
      userImageUrl = normalizeImageUrl(user.profileImage.formats.thumbnail.url)
    }

    // Format the timestamp
    const timestamp = post.publishedAt ? formatTimestamp(post.publishedAt) : "Recently"

    // Ensure documentId exists - use the one from the API or generate one
    const documentId = post.documentId || post.slug || `post-${post.id}`

    // Process media items to ensure they have proper URLs
    const processedMediaItems = mediaItems.map((item: any) => {
      let url = ""
      if (item.file?.url) {
        url = normalizeImageUrl(item.file.url)
      } else if (item.file?.formats?.medium?.url) {
        url = normalizeImageUrl(item.file.formats.medium.url)
      } else if (item.file?.formats?.small?.url) {
        url = normalizeImageUrl(item.file.formats.small.url)
      } else if (item.file?.formats?.thumbnail?.url) {
        url = normalizeImageUrl(item.file.formats.thumbnail.url)
      }

      return {
        id: item.id,
        type: item.type || "image",
        url: url,
        file: item.file,
      }
    })

    return {
      id: post.id,
      documentId,
      userId: user.id || null,
      userDocumentId,
      username: user.username || "unknown",
      userImage: userImageUrl,
      image: imageUrl,
      title: post.title || "", // Ensure title is included
      description: post.description || "",
      likes: likes, // Pass the actual likes array instead of likesCount
      comments: [], // We'll fetch comments separately if needed
      timestamp,
      tags,
      mediaItems: processedMediaItems,
      contentType: post.contentType || "image",
      galleryLayout: post.galleryLayout || "grid",
    }
  } catch (error) {
    console.error("Error transforming post data:", error, "Post data:", post)
    throw new Error(`Error processing post data: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Function to get paginated posts
export async function getPosts(limit = 6, offset = 0): Promise<PostsResponse> {
  try {
    // Calculate the page number from offset and limit
    const page = Math.floor(offset / limit) + 1

    // Add a cache buster to avoid hitting the same cached error
    const cacheBuster = new Date().getTime()

    // Fetch posts from the API
    const response = await PostService.getPosts(page, limit, cacheBuster)

    // Check if the response contains an error
    if (response.error) {
      console.error("API returned an error:", response.error)
      throw new Error(`API error: ${response.error.message || "Unknown error"}`)
    }

    // Check if response and response.data exist before mapping
    if (!response || !response.data) {
      console.error("Invalid API response structure:", response)
      throw new Error("Invalid API response structure")
    }

    // Transform the API response to our Post interface
    const posts = Array.isArray(response.data) ? response.data.map(transformStrapiPost) : []

    // Extract pagination info with fallbacks
    const pagination = response.meta?.pagination || { page: 1, pageSize: limit, pageCount: 1 }
    const hasMore = pagination.page < pagination.pageCount

    return {
      posts,
      hasMore,
      nextPage: hasMore ? pagination.page + 1 : undefined,
    }
  } catch (error) {
    console.error("Error fetching posts:", error)
    throw error
  }
}

// Function to get a single post by ID or documentId
export async function getPostById(idOrDocumentId: string | number): Promise<Post | null> {
  try {
    // Determine if we're dealing with a numeric ID or a documentId string
    const isNumericId = !isNaN(Number(idOrDocumentId))

    // Log the request for debugging
    console.log(`Fetching post with ${isNumericId ? "ID" : "documentId"}: ${idOrDocumentId}`)

    // Fetch the post from the API
    const response = await PostService.getPost(idOrDocumentId)

    // Check if the response contains an error
    if (response.error) {
      console.error("API returned an error:", response.error)
      throw new Error(`API error: ${response.error.message || "Unknown error"}`)
    }

    // Transform the API response to our Post interface
    if (response && response.data) {
      return transformStrapiPost(response.data)
    }

    return null
  } catch (error) {
    console.error(`Error fetching post ${idOrDocumentId}:`, error)
    throw error
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
