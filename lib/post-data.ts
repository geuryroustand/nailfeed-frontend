// Server-side data fetching for posts
import { apiClient } from "@/lib/api-client"
import { fetchWithRetry } from "@/lib/fetch-with-retry"
import { normalizeImageUrl, getImageFormat } from "@/lib/image-utils"

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
  username: string
  userImage: string
  image: string
  description: string
  likes: number
  comments: PostComment[]
  timestamp: string
  tags: string[]
}

export type PaginatedPostsResponse = {
  posts: Post[]
  nextCursor: number | null
  hasMore: boolean
}

// Rate limiting tracking
const RATE_LIMIT = {
  isLimited: false,
  resetTime: 0,
  consecutiveErrors: 0,
}

// Function to get paginated posts - tries API first, falls back to sample data
export async function getPosts(limit = 3, cursor = 0): Promise<PaginatedPostsResponse> {
  console.log(`Getting posts with limit ${limit} and cursor ${cursor}`)

  // Check if we should use sample data based on environment variable or active rate limiting
  if (process.env.USE_SAMPLE_DATA === "true" || RATE_LIMIT.isLimited) {
    console.log(
      RATE_LIMIT.isLimited
        ? `Using sample data due to active rate limiting (resets in ${Math.max(
            0,
            Math.floor((RATE_LIMIT.resetTime - Date.now()) / 1000),
          )} seconds)`
        : "Using sample data based on environment variable",
    )
    return getFallbackPosts(limit, cursor)
  }

  try {
    // Try to fetch posts from Strapi - no caching
    console.log("Fetching posts from Strapi without caching")
    const response = await fetchPostsFromStrapi(limit, cursor)

    // Reset consecutive errors counter on success
    RATE_LIMIT.consecutiveErrors = 0

    return response
  } catch (error) {
    console.error("Error fetching posts from Strapi:", error)

    // Check if it's a rate limit error
    if (error instanceof Error && (error.message.includes("Too Many Requests") || error.message.includes("429"))) {
      console.log("Rate limit exceeded, using fallback data")

      // Set rate limiting for 60 seconds (adjust based on actual API rate limit window)
      RATE_LIMIT.isLimited = true
      RATE_LIMIT.resetTime = Date.now() + 60000 // 1 minute cooldown

      // Schedule reset of rate limit flag
      setTimeout(() => {
        RATE_LIMIT.isLimited = false
        console.log("Rate limit period expired, will try API again on next request")
      }, 60000)
    } else {
      // Increment consecutive errors counter
      RATE_LIMIT.consecutiveErrors++

      // If we've had multiple consecutive errors, temporarily use fallback data
      if (RATE_LIMIT.consecutiveErrors >= 3) {
        RATE_LIMIT.isLimited = true
        RATE_LIMIT.resetTime = Date.now() + 120000 // 2 minute cooldown

        setTimeout(() => {
          RATE_LIMIT.isLimited = false
          RATE_LIMIT.consecutiveErrors = 0
        }, 120000)

        console.log("Multiple consecutive errors, cooling down API requests for 2 minutes")
      }
    }

    return getFallbackPosts(limit, cursor)
  }
}

// Update the fetchPostsFromStrapi function to handle the Strapi v5 response format
async function fetchPostsFromStrapi(limit = 3, cursor = 0): Promise<PaginatedPostsResponse> {
  try {
    // Use a smaller page size to reduce the chance of hitting rate limits
    const pageSize = Math.min(limit, 1) // Even smaller page size (1) to reduce rate limiting
    const page = cursor > 0 ? Math.ceil(cursor / pageSize) + 1 : 1

    // Use the exact endpoint specified with pagination and specific populate parameters
    // Reduce the fields we're requesting to minimize payload size
    const endpoint = `/api/posts?pagination[page]=${page}&populate[mediaItems][populate][file][fields][0]=formats&populate[user][fields][0]=username&populate[user][populate][profileImage][fields][0]=formats&pagination[pageSize]=${pageSize}`
    console.log(`Fetching from endpoint: ${endpoint}`)

    // Try with apiClient and retry logic with more conservative settings
    console.log("Using apiClient with conservative retry logic")
    const response = await fetchWithRetry(() => apiClient.get(endpoint, { cache: "no-store" }, true), {
      maxRetries: 0, // No retries to avoid triggering rate limits
      initialDelay: 5000, // Increased delay
      maxDelay: 10000,
      backoffFactor: 2,
      retryStatusCodes: [500, 502, 503, 504], // Removed 429 (rate limit) to handle differently
      onRetry: (attempt, delay, error) => {
        console.log(`Retrying fetch (attempt ${attempt}) after ${delay}ms due to error:`, error)
      },
    })

    console.log("Strapi response received:", response ? "yes" : "no")

    return processPostsResponse(response, limit, cursor)
  } catch (error) {
    console.error("Error in fetchPostsFromStrapi:", error)

    // Check if it's a rate limit error and throw a specific error
    if (error instanceof Error && (error.message.includes("Too Many Requests") || error.message.includes("429"))) {
      throw new Error("Too Many Requests")
    }

    throw error
  }
}

// Helper function to process the posts response
function processPostsResponse(response: any, limit = 3, cursor = 0): PaginatedPostsResponse {
  // Check if response has the expected structure
  if (!response || !response.data) {
    // Check for error structure
    if (response && response.error) {
      console.error("API returned an error:", response.error)
      throw new Error(`API error (${response.error.code || "unknown"}): ${JSON.stringify(response.error)}`)
    }

    console.error("Invalid response structure:", response)
    throw new Error("Invalid API response structure")
  }

  // Handle different response structures
  const postsData = Array.isArray(response.data)
    ? response.data
    : response.data.data && Array.isArray(response.data.data)
      ? response.data.data
      : []

  // Transform Strapi response to our app's format with better error handling
  const posts = postsData.map((post: any) => {
    try {
      // Extract user information with fallbacks
      const user = post.user || {}
      const username = user.username || "Unknown User"

      // Extract profile image with fallbacks - note the different structure
      let userImage = "/serene-woman-gaze.png"

      // Handle the nested profile image structure from the updated API response
      if (user.profileImage) {
        if (user.profileImage.formats) {
          // Get the best format available
          const formats = user.profileImage.formats
          userImage = normalizeImageUrl(
            formats.medium?.url ||
              formats.small?.url ||
              formats.thumbnail?.url ||
              formats.large?.url ||
              user.profileImage.url,
          )
        } else if (user.profileImage.url) {
          userImage = normalizeImageUrl(user.profileImage.url)
        } else if (typeof user.profileImage === "string") {
          userImage = normalizeImageUrl(user.profileImage)
        }
      }

      // Extract media items with better handling of different response structures
      let mediaItems = []
      const image = post.image // Declare image here
      if (post.mediaItems) {
        if (Array.isArray(post.mediaItems)) {
          // Handle Strapi v5 nested media structure
          mediaItems = post.mediaItems.map((item) => {
            // Get the file URL from the nested structure
            let url = "/abstract-pastel-swirls.png" // Fallback

            if (item.file && item.file.formats) {
              // Get the best format available
              const imageUrl = getImageFormat(item.file.formats)
              if (imageUrl) {
                url = normalizeImageUrl(imageUrl)
              }
            } else if (item.url) {
              // Direct URL case
              url = normalizeImageUrl(item.url)
            }

            return {
              id: item.id || `media-${Math.random()}`,
              type: item.type || "image",
              url: url,
              file: item.file, // Keep the original file object with formats
            }
          })
        } else if (post.mediaItems.data && Array.isArray(post.mediaItems.data)) {
          // Nested in data array (Strapi format)
          mediaItems = post.mediaItems.data.map((item) => {
            const mediaData = item.attributes || item
            return {
              id: item.id || `media-${Math.random()}`,
              type: mediaData.type || (mediaData.url?.includes(".mp4") ? "video" : "image"),
              url:
                mediaData.url ||
                mediaData.formats?.medium?.url ||
                mediaData.formats?.small?.url ||
                mediaData.formats?.thumbnail?.url ||
                "/abstract-pastel-swirls.png",
              file: mediaData.file || mediaData, // Keep the original file object with formats
            }
          })
        }
      }

      // If we still don't have media items but have an image, create a media item from it
      if (mediaItems.length === 0 && image) {
        mediaItems = [
          {
            id: `legacy-image-${Math.random()}`,
            type: "image",
            url: image,
          },
        ]
      }

      // Extract comments with fallbacks
      const comments = (post.comments || []).map((comment: any) => {
        return {
          id: comment.id || Math.random(),
          username: comment.user?.username || "Anonymous",
          text: comment.text || "",
          likes: comment.likes || 0,
          reactions: {},
        }
      })

      // Extract tags with fallbacks
      const tags = (post.tags || []).map((tag: any) => tag.name || "").filter(Boolean)

      return {
        id: post.id || Math.random(),
        documentId: post.documentId || post.id?.toString() || "", // Ensure we capture documentId
        userId: user.id || null,
        username,
        userImage,
        image, // Keep for backward compatibility
        mediaItems, // Add this line
        contentType:
          mediaItems.length > 1
            ? "media-gallery"
            : mediaItems.length === 1
              ? mediaItems[0].type === "video"
                ? "video"
                : "image"
              : "text",
        galleryLayout: mediaItems.length > 1 ? "grid" : undefined,
        description: post.description || "",
        likes: post.likesCount || 0,
        comments,
        timestamp: formatTimestamp(post.createdAt || post.publishedAt || new Date().toISOString()),
        tags,
      }
    } catch (error) {
      console.error("Error transforming post:", error)
      // Return a placeholder post instead of failing completely
      return {
        id: Math.random(),
        username: "Error Loading Post",
        userImage: "/serene-woman-gaze.png",
        image: "/abstract-pastel-swirls.png",
        description: "This post couldn't be loaded correctly.",
        likes: 0,
        comments: [],
        timestamp: "Recently",
        tags: [],
      }
    }
  })

  // Get pagination info with fallbacks
  const pagination = response.meta?.pagination || { page: 1, pageSize: limit, pageCount: 1, total: posts.length }
  const hasMore = pagination.page < pagination.pageCount
  const nextCursor = hasMore ? cursor + limit : null

  return {
    posts,
    nextCursor,
    hasMore,
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
    console.error("Error formatting timestamp:", error)
    return "Recently"
  }
}

// Sample post data as fallback
const allPosts: Post[] = [
  {
    id: 1,
    documentId: "post_1",
    username: "nailartist",
    userImage: "/serene-woman-gaze.png",
    image: "/glitter-french-elegance.png",
    description: "French manicure with a twist! ✨ Added some glitter for that extra sparkle. What do you think?",
    likes: 234,
    comments: [
      {
        id: 1,
        username: "nailfan",
        text: "This is absolutely gorgeous! 😍",
        likes: 12,
        reactions: {
          "👍": { emoji: "👍", count: 5, reacted: false },
          "❤️": { emoji: "❤️", count: 2, reacted: false },
        },
      },
      {
        id: 2,
        username: "glamnails",
        text: "Love the glitter accent! What brand did you use?",
        likes: 5,
        reactions: {
          "👍": { emoji: "👍", count: 3, reacted: false },
          "❤️": { emoji: "❤️", count: 1, reacted: false },
        },
      },
    ],
    timestamp: "2h ago",
    tags: ["frenchmanicure", "glitter", "nailart"],
  },
  {
    id: 2,
    documentId: "post_2",
    username: "trendynails",
    userImage: "/painted-nails-close-up.png",
    image: "/geometric-harmony.png",
    description: "Geometric vibes today! 📐 These took forever but I'm so happy with how they turned out.",
    likes: 187,
    comments: [
      {
        id: 3,
        username: "nailpro",
        text: "The precision is incredible! Great work!",
        likes: 8,
        reactions: {
          like: { emoji: "👍", count: 4, reacted: false },
          heart: { emoji: "❤️", count: 2, reacted: false },
        },
      },
    ],
    timestamp: "5h ago",
    tags: ["geometric", "naildesign", "minimalist"],
  },
  {
    id: 3,
    documentId: "post_3",
    username: "artsynails",
    userImage: "/diverse-avatars.png",
    image: "/vibrant-floral-nails.png",
    description: "Spring is in the air! 🌸 Loving these floral designs for the season.",
    likes: 312,
    comments: [],
    timestamp: "1d ago",
    tags: ["floralnails", "springnails", "nailinspo"],
  },
  {
    id: 4,
    documentId: "post_4",
    username: "nailqueen",
    userImage: "/vibrant-beauty-vlogger.png",
    image: "/abstract-pastel-swirls.png",
    description: "Pastel dreams come true! 💫 These swirls are perfect for spring.",
    likes: 278,
    comments: [{ id: 4, username: "pastelfan", text: "These colors are everything! 💕", likes: 15, reactions: {} }],
    timestamp: "1d ago",
    tags: ["pastel", "swirls", "springnails"],
  },
  {
    id: 5,
    documentId: "post_5",
    username: "nailartpro",
    userImage: "/vibrant-artist-portrait.png",
    image: "/shimmering-gold-flakes.png",
    description: "Gold flakes for the win! ✨ Perfect for a special occasion.",
    likes: 423,
    comments: [
      {
        id: 5,
        username: "goldlover",
        text: "Absolutely stunning! What top coat did you use?",
        likes: 7,
        reactions: {},
      },
    ],
    timestamp: "2d ago",
    tags: ["goldflakes", "luxurynails", "specialoccasion"],
  },
  {
    id: 6,
    documentId: "post_6",
    username: "creativenails",
    userImage: "/stylish-city-dweller.png",
    image: "/intricate-floral-nails.png",
    description: "Spent hours on these intricate florals! 🌺 Worth every minute.",
    likes: 198,
    comments: [],
    timestamp: "2d ago",
    tags: ["floralnails", "intricate", "handpainted"],
  },
  {
    id: 7,
    documentId: "post_7",
    username: "minimalistnails",
    userImage: "/serene-woman-gaze.png",
    image: "/subtle-nude-nails.png",
    description: "Sometimes less is more. 💭 Loving these subtle nude nails for everyday elegance.",
    likes: 145,
    comments: [
      { id: 6, username: "nudelover", text: "So clean and elegant! What shade is this?", likes: 3, reactions: {} },
    ],
    timestamp: "3d ago",
    tags: ["nudenails", "minimalist", "everyday"],
  },
  {
    id: 8,
    documentId: "post_8",
    username: "boldnailart",
    userImage: "/vibrant-nail-studio.png",
    image: "/blue-ombre-nails.png",
    description: "Blue ombre vibes! 🌊 Perfect for summer beach days.",
    likes: 267,
    comments: [],
    timestamp: "3d ago",
    tags: ["ombre", "bluenails", "summernails"],
  },
  {
    id: 9,
    documentId: "post_9",
    username: "floralnailart",
    userImage: "/painted-nails-close-up.png",
    image: "/delicate-daisies.png",
    description: "Delicate daisies for spring! 🌼 These make me so happy.",
    likes: 389,
    comments: [
      { id: 7, username: "flowerfan", text: "These are so cute! Perfect for spring!", likes: 9, reactions: {} },
    ],
    timestamp: "4d ago",
    tags: ["daisies", "floralnails", "springnails"],
  },
  {
    id: 10,
    documentId: "post_10",
    username: "luxurynails",
    userImage: "/diverse-avatars.png",
    image: "/gold-veined-marble-nails.png",
    description: "Marble and gold - a match made in heaven! ✨ Feeling luxurious today.",
    likes: 211,
    comments: [],
    timestamp: "4d ago",
    tags: ["marble", "gold", "luxurynails"],
  },
  {
    id: 11,
    documentId: "post_11",
    username: "neonlover",
    userImage: "/vibrant-beauty-vlogger.png",
    image: "/electric-angles.png",
    description: "Electric vibes only! ⚡ These neon angles are perfect for summer nights.",
    likes: 176,
    comments: [
      {
        id: 8,
        username: "neonqueen",
        text: "These are FIRE! 🔥 What neon polish did you use?",
        likes: 5,
        reactions: {},
      },
    ],
    timestamp: "5d ago",
    tags: ["neon", "geometric", "summernails"],
  },
  {
    id: 12,
    documentId: "post_12",
    username: "nailartist",
    userImage: "/serene-woman-gaze.png",
    image: "/3d-flower-nails.png",
    description: "3D flowers for the win! 🌸 These took forever but I'm obsessed.",
    likes: 432,
    comments: [
      { id: 9, username: "3dfan", text: "The dimension is incredible! Tutorial please!", likes: 18, reactions: {} },
    ],
    timestamp: "5d ago",
    tags: ["3dnails", "flowernails", "nailart"],
  },
  {
    id: 13,
    documentId: "post_13",
    username: "trendynails",
    userImage: "/painted-nails-close-up.png",
    image: "/marble-gold-nails.png",
    description: "Marble and gold accents - my favorite combo! ✨ Perfect for any occasion.",
    likes: 298,
    comments: [],
    timestamp: "6d ago",
    tags: ["marble", "gold", "elegant"],
  },
  {
    id: 14,
    documentId: "post_14",
    username: "boldnailart",
    userImage: "/vibrant-nail-studio.png",
    image: "/neon-geometric-nails.png",
    description: "Bold geometric patterns with neon accents! 📐 Making a statement.",
    likes: 187,
    comments: [
      { id: 10, username: "geometryfan", text: "These are so unique! Love the color combo!", likes: 7, reactions: {} },
    ],
    timestamp: "6d ago",
    tags: ["geometric", "neon", "boldnails"],
  },
  {
    id: 15,
    documentId: "post_15",
    username: "minimalistnails",
    userImage: "/serene-woman-gaze.png",
    image: "/minimalist-nude-nails.png",
    description: "Clean lines and nude tones - my go-to for a professional look. 💼",
    likes: 156,
    comments: [],
    timestamp: "1w ago",
    tags: ["minimalist", "nude", "professional"],
  },
]

// Function to get fallback paginated posts
function getFallbackPosts(limit = 3, cursor = 0): PaginatedPostsResponse {
  console.log(`Using fallback posts with limit ${limit} and cursor ${cursor}`)

  // Get posts after the cursor
  const startIndex = cursor
  const endIndex = startIndex + limit
  const posts = allPosts.slice(startIndex, endIndex)

  // Determine if there are more posts
  const hasMore = endIndex < allPosts.length

  // Return paginated response
  return {
    posts,
    nextCursor: hasMore ? endIndex : null,
    hasMore,
  }
}

// Function to get a single post by ID or documentId
export async function getPostById(idOrDocumentId: number | string): Promise<Post | null> {
  console.log(`Getting post with ID or documentId: ${idOrDocumentId}`)

  // Check if we should use sample data based on environment variable or active rate limiting
  if (process.env.USE_SAMPLE_DATA === "true" || RATE_LIMIT.isLimited) {
    console.log(
      RATE_LIMIT.isLimited
        ? "Using sample data due to active rate limiting"
        : "Using sample data based on environment variable",
    )
    return getFallbackPostById(idOrDocumentId)
  }

  try {
    // Try to fetch the post from Strapi
    console.log("Fetching post from Strapi")
    const post = await fetchPostFromStrapi(idOrDocumentId)

    // Reset consecutive errors counter on success
    RATE_LIMIT.consecutiveErrors = 0

    return post
  } catch (error) {
    console.error(`Error fetching post with ID/documentId ${idOrDocumentId} from Strapi:`, error)

    // Check if it's a rate limit error
    if (error instanceof Error && (error.message.includes("Too Many Requests") || error.message.includes("429"))) {
      console.log("Rate limit exceeded, using fallback data")

      // Set rate limiting for 60 seconds
      RATE_LIMIT.isLimited = true
      RATE_LIMIT.resetTime = Date.now() + 60000

      // Schedule reset of rate limit flag
      setTimeout(() => {
        RATE_LIMIT.isLimited = false
        console.log("Rate limit period expired, will try API again on next request")
      }, 60000)
    } else {
      // Increment consecutive errors counter
      RATE_LIMIT.consecutiveErrors++

      // If we've had multiple consecutive errors, temporarily use fallback data
      if (RATE_LIMIT.consecutiveErrors >= 3) {
        RATE_LIMIT.isLimited = true
        RATE_LIMIT.resetTime = Date.now() + 120000 // 2 minute cooldown

        setTimeout(() => {
          RATE_LIMIT.isLimited = false
          RATE_LIMIT.consecutiveErrors = 0
        }, 120000)

        console.log("Multiple consecutive errors, cooling down API requests for 2 minutes")
      }
    }

    return getFallbackPostById(idOrDocumentId)
  }
}

// Function to fetch a single post from Strapi
async function fetchPostFromStrapi(idOrDocumentId: number | string): Promise<Post | null> {
  try {
    // Determine if we're using a numeric ID or a documentId
    const isNumericId = /^\d+$/.test(idOrDocumentId.toString())

    // Use the appropriate endpoint based on the ID type
    // For documentId, use the filters approach
    // For numeric ID, use the direct ID approach but with simplified populate parameters
    const endpoint = isNumericId
      ? `/api/posts/${idOrDocumentId}?populate[mediaItems][populate]=*&populate[user]=*`
      : `/api/posts?filters[documentId][$eq]=${idOrDocumentId}&populate[mediaItems][populate]=*&populate[user]=*`

    console.log(`Fetching from endpoint: ${endpoint}`)

    // Use apiClient with retry logic
    const response = await fetchWithRetry(() => apiClient.get(endpoint, { cache: "no-store" }, true), {
      maxRetries: 0, // No retries to avoid triggering rate limits
      initialDelay: 2000,
      maxDelay: 5000,
      backoffFactor: 2,
      retryStatusCodes: [500, 502, 503, 504],
      onRetry: (attempt, delay, error) => {
        console.log(`Retrying fetch (attempt ${attempt}) after ${delay}ms due to error:`, error)
      },
    })

    if (!response || !response.data) {
      console.error("Invalid response structure:", response)
      return null
    }

    // Process the post data based on whether we used a filter or direct ID
    let postData

    if (isNumericId) {
      // Direct ID endpoint returns the post directly
      postData = response.data
    } else {
      // Filter endpoint returns an array, take the first item
      const postsArray = Array.isArray(response.data) ? response.data : []
      if (postsArray.length === 0) {
        console.log(`No post found with documentId: ${idOrDocumentId}`)
        return null
      }
      postData = postsArray[0]
    }

    return transformPostData(postData)
  } catch (error) {
    console.error(`Error in fetchPostFromStrapi for ID/documentId ${idOrDocumentId}:`, error)
    throw error
  }
}

// Helper function to transform post data
function transformPostData(postData: any): Post | null {
  try {
    // Extract user information with fallbacks
    const user = postData.user || {}
    const username = user.username || "Unknown User"

    // Extract profile image with fallbacks
    let userImage = "/serene-woman-gaze.png"

    // Handle the nested profile image structure
    if (user.profileImage) {
      if (user.profileImage.formats) {
        // Get the best format available
        const formats = user.profileImage.formats
        userImage = normalizeImageUrl(
          formats.medium?.url ||
            formats.small?.url ||
            formats.thumbnail?.url ||
            formats.large?.url ||
            user.profileImage.url,
        )
      } else if (user.profileImage.url) {
        userImage = normalizeImageUrl(user.profileImage.url)
      } else if (typeof user.profileImage === "string") {
        userImage = normalizeImageUrl(user.profileImage)
      }
    }

    // Extract media items
    let mediaItems = []
    const image = postData.image
    if (postData.mediaItems) {
      if (Array.isArray(postData.mediaItems)) {
        // Handle Strapi v5 nested media structure
        mediaItems = postData.mediaItems.map((item) => {
          // Get the file URL from the nested structure
          let url = "/abstract-pastel-swirls.png" // Fallback

          if (item.file && item.file.formats) {
            // Get the best format available
            const imageUrl = getImageFormat(item.file.formats)
            if (imageUrl) {
              url = normalizeImageUrl(imageUrl)
            }
          } else if (item.url) {
            // Direct URL case
            url = normalizeImageUrl(item.url)
          }

          return {
            id: item.id || `media-${Math.random()}`,
            type: item.type || "image",
            url: url,
            file: item.file, // Keep the original file object with formats
          }
        })
      } else if (postData.mediaItems.data && Array.isArray(postData.mediaItems.data)) {
        // Nested in data array (Strapi format)
        mediaItems = postData.mediaItems.data.map((item) => {
          const mediaData = item.attributes || item
          return {
            id: item.id || `media-${Math.random()}`,
            type: mediaData.type || (mediaData.url?.includes(".mp4") ? "video" : "image"),
            url:
              mediaData.url ||
              mediaData.formats?.medium?.url ||
              mediaData.formats?.small?.url ||
              mediaData.formats?.thumbnail?.url ||
              "/abstract-pastel-swirls.png",
            file: mediaData.file || mediaData, // Keep the original file object with formats
          }
        })
      }
    }

    // If we still don't have media items but have an image, create a media item from it
    if (mediaItems.length === 0 && image) {
      mediaItems = [
        {
          id: `legacy-image-${Math.random()}`,
          type: "image",
          url: image,
        },
      ]
    }

    // Extract comments with fallbacks - simplified to avoid API errors
    const comments = []

    // Extract tags with fallbacks - simplified to avoid API errors
    const tags = []

    return {
      id: postData.id || Math.random(),
      documentId: postData.documentId || postData.id?.toString() || "",
      userId: user.id || null,
      username,
      userImage,
      image, // Keep for backward compatibility
      mediaItems,
      contentType:
        mediaItems.length > 1
          ? "media-gallery"
          : mediaItems.length === 1
            ? mediaItems[0].type === "video"
              ? "video"
              : "image"
            : "text",
      galleryLayout: mediaItems.length > 1 ? "grid" : undefined,
      description: postData.description || "",
      likes: postData.likesCount || 0,
      comments,
      timestamp: formatTimestamp(postData.createdAt || postData.publishedAt || new Date().toISOString()),
      tags,
    }
  } catch (error) {
    console.error("Error transforming post:", error)
    return null
  }
}

// Function to get a fallback post by ID or documentId
function getFallbackPostById(idOrDocumentId: number | string): Post | null {
  console.log(`Using fallback post with ID/documentId: ${idOrDocumentId}`)

  // Try to find by documentId first
  let post = allPosts.find((p) => p.documentId === idOrDocumentId.toString())

  // If not found, try by numeric ID
  if (!post) {
    const numericId = typeof idOrDocumentId === "string" ? Number.parseInt(idOrDocumentId, 10) : idOrDocumentId
    post = allPosts.find((p) => p.id === numericId)
  }

  return post || null
}
