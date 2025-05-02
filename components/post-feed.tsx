"use client"

import { useState, useCallback, useEffect } from "react"
import Post from "@/components/post"
import { Button } from "@/components/ui/button"
import { PlusCircle, Filter } from "lucide-react"
import CreatePostModal from "@/components/create-post-modal"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSearch } from "@/context/search-context"
import { useToast } from "@/hooks/use-toast"
import { LoadMorePosts } from "@/components/load-more-posts"
import { PostService } from "@/lib/services/post-service"
import type { Post as PostType } from "@/lib/post-data"
// Import the new API diagnostics component
import ApiDiagnostics from "@/components/api-diagnostics"

interface PostFeedProps {
  initialPosts: PostType[]
  initialNextCursor: number | null
  initialHasMore: boolean
}

export default function PostFeed({ initialPosts, initialNextCursor, initialHasMore }: PostFeedProps) {
  const [posts, setPosts] = useState<PostType[]>(initialPosts)
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards")
  const [apiError, setApiError] = useState<string | null>(null)
  const { isSearching } = useSearch()
  const { toast } = useToast()

  // Fetch posts on component mount to ensure we have the latest data
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setIsLoading(true)
        setApiError(null)

        console.log("Fetching latest posts...")
        const result = await PostService.getPosts(1, 10)

        // Debug logging
        console.log("API Response structure:", {
          hasData: !!result.data,
          dataType: result.data ? (Array.isArray(result.data) ? "array" : typeof result.data) : "none",
          dataLength: Array.isArray(result.data) ? result.data.length : 0,
          hasMeta: !!result.meta,
        })

        if (!result.data || !Array.isArray(result.data)) {
          console.error("Invalid response structure - data is not an array:", result)
          setApiError("Invalid API response structure - data is not an array")
          return
        }

        if (result.data.length === 0) {
          console.log("API returned empty posts array")
          setPosts([])
          return
        }

        // Log the first post to understand its structure
        console.log("First post structure:", JSON.stringify(result.data[0], null, 2))

        // Transform the data to match our Post type with better error handling
        const transformedPosts = result.data.map((item: any, index: number) => {
          try {
            // For debugging the first item in detail
            if (index === 0) {
              console.log("Transforming first post:", JSON.stringify(item, null, 2))
            }

            // Get the post data - could be directly in the item or in item.attributes
            const post = item.attributes || item

            // Debug user data
            if (index === 0) {
              console.log("User data:", JSON.stringify(post.user, null, 2))
            }

            // Handle user data with multiple possible structures
            let username = "Unknown User"
            let userImage = "/serene-woman-gaze.png"
            let userId = null

            if (post.user) {
              if (typeof post.user === "object" && post.user !== null) {
                if (post.user.username) {
                  username = post.user.username
                  userId = post.user.id || post.user.documentId

                  // Handle nested profile image structure
                  if (post.user.profileImage && post.user.profileImage.formats) {
                    const format =
                      post.user.profileImage.formats.medium ||
                      post.user.profileImage.formats.small ||
                      post.user.profileImage.formats.thumbnail

                    if (format && format.url) {
                      const apiUrl =
                        process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
                      userImage = `${apiUrl}${format.url}`
                    }
                  } else if (post.user.profileImage?.url) {
                    userImage = post.user.profileImage.url
                  }
                } else if (post.user.data) {
                  // Nested in data
                  const userData = post.user.data.attributes || post.user.data
                  username = userData.username || "Unknown User"
                  userImage =
                    userData.profileImage?.data?.attributes?.url ||
                    userData.profileImage?.url ||
                    "/serene-woman-gaze.png"
                  userId = post.user.data.id || post.user.data.documentId
                }
              }
              // User ID as string/number
              else if (typeof post.user === "string" || typeof post.user === "number") {
                userId = post.user
                username = "User " + userId
              }
            }

            // Debug media items
            if (index === 0) {
              console.log("Media items:", JSON.stringify(post.mediaItems, null, 2))
            }

            // Extract media items with better handling of different response structures
            let mediaItems = []
            if (post.mediaItems) {
              if (Array.isArray(post.mediaItems)) {
                // Handle Strapi v5 nested media structure
                mediaItems = post.mediaItems.map((item) => {
                  // Get the file URL from the nested structure
                  let url = "/abstract-pastel-swirls.png" // Fallback

                  if (item.file && item.file.formats) {
                    // Prefer medium format, fall back to other sizes
                    const format =
                      item.file.formats.medium ||
                      item.file.formats.small ||
                      item.file.formats.large ||
                      item.file.formats.thumbnail

                    if (format && format.url) {
                      // Construct full URL by prepending API base URL
                      const apiUrl =
                        process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
                      url = `${apiUrl}${format.url}`
                    }
                  } else if (item.url) {
                    // Direct URL case
                    url = item.url
                  }

                  return {
                    id: item.id || `media-${Math.random()}`,
                    type: item.type || "image",
                    url: url,
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
                  }
                })
              }
            }

            // If we still don't have media items but have an image, create a media item from it
            const image = post.image
            if (mediaItems.length === 0 && image) {
              mediaItems = [
                {
                  id: `legacy-image-${Math.random()}`,
                  type: "image",
                  url: image,
                },
              ]
            }

            // Handle comments with multiple possible structures
            const comments = []
            if (post.comments) {
              if (Array.isArray(post.comments)) {
                // Direct array
                comments.push(
                  ...post.comments.map((comment: any) => ({
                    id: comment.id || Math.random(),
                    username: comment.user?.username || "Anonymous",
                    text: comment.text || comment.content || "",
                    likes: comment.likes || 0,
                    reactions: {},
                  })),
                )
              } else if (post.comments.data && Array.isArray(post.comments.data)) {
                // Nested in data array
                comments.push(
                  ...post.comments.data.map((comment: any) => {
                    const commentData = comment.attributes || comment
                    return {
                      id: comment.id || Math.random(),
                      username:
                        commentData.user?.data?.attributes?.username || commentData.user?.username || "Anonymous",
                      text: commentData.text || commentData.content || "",
                      likes: commentData.likes || 0,
                      reactions: {},
                    }
                  }),
                )
              }
            }

            // Handle tags with multiple possible structures
            let tags: string[] = []
            if (post.tags) {
              if (Array.isArray(post.tags)) {
                // Direct array
                tags = post.tags.map((tag: any) => (typeof tag === "string" ? tag : tag.name || "")).filter(Boolean)
              } else if (post.tags.data && Array.isArray(post.tags.data)) {
                // Nested in data array
                tags = post.tags.data
                  .map((tag: any) => {
                    const tagData = tag.attributes || tag
                    return tagData.name || ""
                  })
                  .filter(Boolean)
              }
            }

            return {
              id: item.id || Math.random(),
              documentId: post.documentId || item.id?.toString() || "",
              userId,
              username,
              userImage,
              image, // Keep this for backward compatibility
              mediaItems, // Add this line to include the media items
              contentType:
                mediaItems.length > 1
                  ? "media-gallery"
                  : mediaItems.length === 1
                    ? mediaItems[0].type === "video"
                      ? "video"
                      : "image"
                    : "text",
              galleryLayout: mediaItems.length > 1 ? "grid" : undefined,
              description: post.description || post.content || "",
              likes: post.likes || post.likesCount || 0,
              comments,
              timestamp: formatTimestamp(post.createdAt || post.publishedAt || new Date().toISOString()),
              tags,
            }
          } catch (err) {
            console.error(`Error transforming post at index ${index}:`, err)
            // Return a placeholder post on error
            return {
              id: Math.random(),
              username: "Error Loading",
              userImage: "/serene-woman-gaze.png",
              image: "/abstract-pastel-swirls.png",
              description: "There was an error loading this post.",
              likes: 0,
              comments: [],
              timestamp: "Just now",
              tags: [],
            }
          }
        })

        console.log(`Transformed ${transformedPosts.length} posts`)
        setPosts(transformedPosts)

        // Update pagination info
        const pagination = result.meta?.pagination || {
          page: 1,
          pageSize: 10,
          pageCount: transformedPosts.length > 0 ? 2 : 1,
          total: transformedPosts.length,
        }

        const newHasMore = pagination.page < pagination.pageCount
        setHasMore(newHasMore)
        setNextCursor(newHasMore ? pagination.page + 1 : null)
      } catch (error: any) {
        console.error("Error fetching latest posts:", error)
        setApiError(error.message || "Failed to load posts")
        toast({
          title: "Error",
          description: "Failed to load the latest posts. Using cached data instead.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLatestPosts()
  }, [toast])

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

  const loadMorePosts = useCallback(async () => {
    if (!nextCursor || isLoading) return

    setIsLoading(true)

    try {
      const result = await PostService.getPosts(nextCursor, 10)

      // Transform the data with the same logic as above
      const transformedPosts = result.data.map((item: any) => {
        try {
          const post = item.attributes || item

          // Handle user data
          let username = "Unknown User"
          let userImage = "/serene-woman-gaze.png"
          let userId = null

          if (post.user) {
            if (typeof post.user === "object" && post.user !== null) {
              if (post.user.username) {
                username = post.user.username
                userId = post.user.id || post.user.documentId

                // Handle nested profile image structure
                if (post.user.profileImage && post.user.profileImage.formats) {
                  const format =
                    post.user.profileImage.formats.medium ||
                    post.user.profileImage.formats.small ||
                    post.user.profileImage.formats.thumbnail

                  if (format && format.url) {
                    const apiUrl =
                      process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
                    userImage = `${apiUrl}${format.url}`
                  }
                } else if (post.user.profileImage?.url) {
                  userImage = post.user.profileImage.url
                }
              } else if (post.user.data) {
                const userData = post.user.data.attributes || post.user.data
                username = userData.username || "Unknown User"
                userImage =
                  userData.profileImage?.data?.attributes?.url || userData.profileImage?.url || "/serene-woman-gaze.png"
                userId = post.user.data.id || post.user.data.documentId
              }
            } else if (typeof post.user === "string" || typeof post.user === "number") {
              userId = post.user
              username = "User " + userId
            }
          }

          // Extract media items with better handling of different response structures
          let mediaItems = []
          const image = post.image
          if (post.mediaItems) {
            if (Array.isArray(post.mediaItems)) {
              // Handle Strapi v5 nested media structure
              mediaItems = post.mediaItems.map((item) => {
                // Get the file URL from the nested structure
                let url = "/abstract-pastel-swirls.png" // Fallback

                if (item.file && item.file.formats) {
                  // Prefer medium format, fall back to other sizes
                  const format =
                    item.file.formats.medium ||
                    item.file.formats.small ||
                    item.file.formats.large ||
                    item.file.formats.thumbnail

                  if (format && format.url) {
                    // Construct full URL by prepending API base URL
                    const apiUrl =
                      process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
                    url = `${apiUrl}${format.url}`
                  }
                } else if (item.url) {
                  // Direct URL case
                  url = item.url
                }

                return {
                  id: item.id || `media-${Math.random()}`,
                  type: item.type || "image",
                  url: url,
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

          // Handle comments
          const comments = []
          if (post.comments) {
            if (Array.isArray(post.comments)) {
              comments.push(
                ...post.comments.map((comment: any) => ({
                  id: comment.id || Math.random(),
                  username: comment.user?.username || "Anonymous",
                  text: comment.text || comment.content || "",
                  likes: comment.likes || 0,
                  reactions: {},
                })),
              )
            } else if (post.comments.data && Array.isArray(post.comments.data)) {
              comments.push(
                ...post.comments.data.map((comment: any) => {
                  const commentData = comment.attributes || comment
                  return {
                    id: comment.id || Math.random(),
                    username: commentData.user?.data?.attributes?.username || commentData.user?.username || "Anonymous",
                    text: commentData.text || commentData.content || "",
                    likes: commentData.likes || 0,
                    reactions: {},
                  }
                }),
              )
            }
          }

          // Handle tags
          let tags: string[] = []
          if (post.tags) {
            if (Array.isArray(post.tags)) {
              tags = post.tags.map((tag: any) => (typeof tag === "string" ? tag : tag.name || "")).filter(Boolean)
            } else if (post.tags.data && Array.isArray(post.tags.data)) {
              tags = post.tags.data
                .map((tag: any) => {
                  const tagData = tag.attributes || tag
                  return tagData.name || ""
                })
                .filter(Boolean)
            }
          }

          return {
            id: item.id || Math.random(),
            documentId: post.documentId || item.id?.toString() || "",
            userId,
            username,
            userImage,
            image, // Keep this for backward compatibility
            mediaItems, // Add this line to include the media items
            contentType:
              mediaItems.length > 1
                ? "media-gallery"
                : mediaItems.length === 1
                  ? mediaItems[0].type === "video"
                    ? "video"
                    : "image"
                  : "text",
            galleryLayout: mediaItems.length > 1 ? "grid" : undefined,
            description: post.description || post.content || "",
            likes: post.likes || post.likesCount || 0,
            comments,
            timestamp: formatTimestamp(post.createdAt || post.publishedAt || new Date().toISOString()),
            tags,
          }
        } catch (err) {
          console.error("Error transforming post:", err)
          // Return a placeholder post on error
          return {
            id: Math.random(),
            username: "Error Loading",
            userImage: "/serene-woman-gaze.png",
            image: "/abstract-pastel-swirls.png",
            description: "There was an error loading this post.",
            likes: 0,
            comments: [],
            timestamp: "Just now",
            tags: [],
          }
        }
      })

      setPosts((prevPosts) => [...prevPosts, ...transformedPosts])

      // Update pagination info
      const pagination = result.meta?.pagination || {
        page: nextCursor,
        pageSize: 10,
        pageCount: nextCursor + 1,
        total: posts.length + transformedPosts.length,
      }

      const newHasMore = pagination.page < pagination.pageCount
      setHasMore(newHasMore)
      setNextCursor(newHasMore ? pagination.page + 1 : null)
    } catch (error: any) {
      console.error("Error loading more posts:", error)
      setApiError(error.message || "Failed to load more posts")
      toast({
        title: "Error",
        description: "Failed to load more posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [nextCursor, isLoading, toast, posts.length, hasMore])

  const addPost = (newPost: PostType) => {
    setPosts([newPost, ...posts])
  }

  const handlePostDeleted = (postId: number) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
  }

  const handlePostUpdated = (updatedPost: PostType) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
  }

  // Don't show the regular feed if search results are being displayed
  if (isSearching) return null

  return (
    <div className="space-y-6">
      {/* API Debugger - only in development */}
      {process.env.NODE_ENV !== "production" && <ApiDiagnostics />}

      {/* API Error Display */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error loading posts</p>
          <p className="text-sm">{apiError}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Feed</h2>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Most Recent</DropdownMenuItem>
                <DropdownMenuItem>Most Popular</DropdownMenuItem>
                <DropdownMenuItem>Following Only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tabs defaultValue="cards" className="hidden sm:block">
              <TabsList className="h-8">
                <TabsTrigger value="cards" onClick={() => setViewMode("cards")} className="h-7 px-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </TabsTrigger>
                <TabsTrigger value="compact" onClick={() => setViewMode("compact")} className="h-7 px-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4"
        >
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg h-12"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Post
          </Button>
        </motion.div>

        <div className="divide-y divide-gray-100">
          <AnimatePresence>
            {isLoading && posts.length === 0 ? (
              <div className="p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
                  <p className="text-gray-500">Loading posts...</p>
                </div>
              </div>
            ) : posts.length > 0 ? (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.1, 0.5) }} // Cap the delay to avoid long waits
                  exit={{ opacity: 0, y: -50 }}
                >
                  <Post
                    post={post}
                    viewMode={viewMode}
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                  />
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No posts found. Create your first post!</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Infinite scroll loading indicator */}
        <LoadMorePosts onLoadMore={loadMorePosts} hasMore={hasMore} isLoading={isLoading} />
      </div>

      <AnimatePresence>
        {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} onPostCreated={addPost} />}
      </AnimatePresence>
    </div>
  )
}
