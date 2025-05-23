import { ExploreService } from "./services/explore-service"
import { useSampleData } from "./config"

export interface MediaFormat {
  url: string
  width: number
  height: number
  size: number
  mime: string
}

export interface MediaItem {
  id: number
  documentId: string
  type: string
  order: number
  url: string
  formats: {
    thumbnail?: MediaFormat
    small?: MediaFormat
    medium?: MediaFormat
    large?: MediaFormat
  }
}

export interface ExplorePost {
  id: number
  documentId: string
  image: string
  imageFormats: any
  likes: number
  comments: number
  username: string
  displayName: string
  userImage: string
  description: string
  title: string
  contentType: string
  galleryLayout: string
  tags: string[]
  createdAt: string
  mediaItems: MediaItem[]
}

export interface ExplorePostWithLiked extends ExplorePost {
  isLiked: boolean
  isSaved: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  error?: {
    code: string
    message: string
  }
}

// Fetch explore posts from the API
export async function getExplorePosts(limit = 12, page = 1): Promise<PaginatedResponse<ExplorePost>> {
  const shouldUseSampleData = useSampleData()

  if (shouldUseSampleData) {
    console.log("Using sample data for explore posts")
    // Return sample data
    return {
      data: Array(limit)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          documentId: `sample-${i + 1}`,
          image: `/nail-art-${(i % 2) + 1}.png`,
          imageFormats: null,
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          username: `user${i + 1}`,
          displayName: `User ${i + 1}`,
          userImage: "/diverse-user-avatars.png",
          description: `Sample nail art design ${i + 1}`,
          title: `Sample Design ${i + 1}`,
          contentType: "media-gallery",
          galleryLayout: "grid",
          tags: ["sample", "nailart", "design"],
          createdAt: new Date().toISOString(),
          mediaItems: [
            {
              id: i + 1,
              documentId: `sample-media-${i + 1}`,
              type: "image",
              order: 0,
              url: `/nail-art-${(i % 2) + 1}.png`,
              formats: {},
            },
          ],
        })),
      nextCursor: page < 3 ? String(page + 1) : null,
      hasMore: page < 3,
    }
  }

  try {
    // Use the ExploreService to fetch data
    return await ExploreService.getExplorePosts(limit, page)
  } catch (error) {
    console.error("Error in getExplorePosts:", error)
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
}

// Get user's liked and saved posts
export async function getUserInteractions(userId: string): Promise<{
  likedPostIds: number[]
  savedPostIds: number[]
}> {
  try {
    // Call the service function
    return await ExploreService.getUserInteractions(userId)
  } catch (error) {
    console.error("Error in getUserInteractions:", error)
    // Return empty arrays on error
    return {
      likedPostIds: [],
      savedPostIds: [],
    }
  }
}

// Get post comments
export async function getPostComments(postId: number) {
  try {
    // Use the ExploreService to fetch comments
    return await ExploreService.getPostComments(postId)
  } catch (error) {
    console.error("Error in getPostComments:", error)
    // Return empty array on error
    return []
  }
}
