"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Post from "./post"
import { getPosts, type Post as PostType } from "@/lib/post-data"
import LoadMorePosts from "./load-more-posts"
import CreatePostModal from "./create-post-modal"
import { Button } from "@/components/ui/button"
import { PlusCircle, Filter, AlertCircle, RefreshCw, WifiOff } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSearch } from "@/context/search-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ReactionProvider } from "@/context/reaction-context"

// Hardcoded API base URL for testing
const API_BASE_URL = "https://nailfeed-backend-production.up.railway.app"

interface PostFeedProps {
  initialPosts?: PostType[]
  initialHasMore?: boolean
  initialNextPage?: number
  initialError?: {
    code: number | string
    message: string
  }
}

export default function PostFeed({
  initialPosts,
  initialHasMore = true,
  initialNextPage = 1,
  initialError,
}: PostFeedProps) {
  const [posts, setPosts] = useState<PostType[]>(initialPosts || [])
  const [isLoading, setIsLoading] = useState(!initialPosts || initialPosts.length === 0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [nextPage, setNextPage] = useState(initialNextPage)
  const [pageSize, setPageSize] = useState(6) // Add this line to track page size
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards")
  const [apiError, setApiError] = useState<string | null>(initialError ? initialError.message : null)
  const [retryCount, setRetryCount] = useState(0)
  const { isSearching } = useSearch()
  const { toast } = useToast()
  const router = useRouter()
  const isOffline = useRef(false)
  const [isConnectionError, setIsConnectionError] = useState(false)

  // Check if we're offline
  useEffect(() => {
    const handleOnline = () => {
      isOffline.current = false
      setIsConnectionError(false)
      if (retryCount > 0) {
        loadInitialPosts()
      }
    }

    const handleOffline = () => {
      isOffline.current = true
      setIsConnectionError(true)
      setApiError("You are currently offline. Please check your internet connection.")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    if (!navigator.onLine) {
      isOffline.current = true
      setIsConnectionError(true)
      setApiError("You are currently offline. Please check your internet connection.")
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [retryCount])

  const loadInitialPosts = useCallback(async () => {
    // Don't reload if we already have initial posts and no error
    if (initialPosts && initialPosts.length > 0 && !initialError && retryCount === 0) {
      return
    }

    // Don't attempt to load if we're offline
    if (isOffline.current) {
      setApiError("You are currently offline. Please check your internet connection.")
      setIsConnectionError(true)
      return
    }

    // If we're retrying after a rate limit, add exponential backoff
    if (initialError?.code === 429 && retryCount > 0) {
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000)
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
    }

    setIsLoading(true)
    setApiError(null)
    setIsConnectionError(false)

    try {
      const response = await getPosts(6, 0)

      // Handle errors
      if (response.error) {
        setApiError(response.error.message || "Error loading posts")

        // If we have posts despite the error (fallback data), show them
        if (response.posts && response.posts.length > 0) {
          setPosts(response.posts)
          setHasMore(false)
          setNextPage(undefined)
          return
        }

        // Handle rate limit errors
        if (response.error.code === 429) {
          // Schedule a retry with backoff
          const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 30000)
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, retryDelay)
        }

        return
      }

      // Ensure each post has a documentId
      const postsWithDocumentId = response.posts.map((post) => {
        if (!post.documentId) {
          // If documentId is missing, create one based on the post ID
          return {
            ...post,
            documentId: `post-${post.id}`,
          }
        }
        return post
      })

      setPosts(postsWithDocumentId)
      setHasMore(response.hasMore)
      setNextPage(response.nextPage || 1)

      // Reset retry count on success
      if (retryCount > 0) {
        setRetryCount(0)
      }
    } catch (error) {
      setApiError("Failed to load posts. Please try again later.")

      // Check if it's a network error
      if (
        error instanceof Error &&
        (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("connection"))
      ) {
        setIsConnectionError(true)
        setApiError("Network error. Please check your connection and try again.")
      } else {
        setApiError("Failed to load more posts. Please try again later.")
      }

      toast({
        title: "Error loading posts",
        description: "We couldn't load the latest posts. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [initialPosts, initialError, retryCount, toast])

  useEffect(() => {
    if (!initialPosts || initialPosts.length === 0 || initialError) {
      loadInitialPosts()
    }
  }, [initialPosts, initialError, loadInitialPosts])

  const loadMorePosts = async () => {
    if (!hasMore || isLoading || isOffline.current) return

    setIsLoading(true)
    try {
      const offset = (nextPage - 1) * 6 // Changed from 10 to 6
      const response = await getPosts(6, offset) // Changed from 10 to 6

      // Handle errors
      if (response.error) {
        setApiError(response.error.message || "Error loading more posts")

        toast({
          title: "Error loading more posts",
          description: response.error.message || "We couldn't load additional posts. Please try again later.",
          variant: "destructive",
        })

        return
      }

      // Check for duplicates and only add new posts
      const existingIds = new Set(posts.map((post) => post.id))
      const newPosts = response.posts.filter((post) => !existingIds.has(post.id))

      // Ensure each new post has a documentId
      const newPostsWithDocumentId = newPosts.map((post) => {
        if (!post.documentId) {
          return {
            ...post,
            documentId: `post-${post.id}`,
          }
        }
        return post
      })

      setPosts((prevPosts) => [...prevPosts, ...newPostsWithDocumentId])
      setHasMore(response.hasMore)
      setNextPage(response.nextPage || nextPage + 1)
    } catch (error) {
      setApiError("Failed to load more posts. Please try again later.")

      // Check if it's a network error
      if (
        error instanceof Error &&
        (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("connection"))
      ) {
        setIsConnectionError(true)
        setApiError("Network error. Please check your connection and try again.")
      } else {
        setApiError("Failed to load more posts. Please try again later.")
      }

      toast({
        title: "Error loading more posts",
        description: "We couldn't load additional posts. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostCreated = (newPost: PostType) => {
    // Ensure the new post has a documentId
    const postWithDocumentId = {
      ...newPost,
      documentId: newPost.documentId || `post-${newPost.id}`,
    }

    // Process mediaItems to ensure they have proper URLs
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    let processedMediaItems = []

    if (newPost.mediaItems && newPost.mediaItems.length > 0) {
      processedMediaItems = newPost.mediaItems.map((item) => {
        // If the item already has a complete URL, use it
        if (item.url && item.url.startsWith("http")) {
          return item
        }

        // If the item has a file with formats, extract the URL
        if (item.file && item.file.formats) {
          const formats = item.file.formats
          const formatUrl = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || formats.large?.url

          if (formatUrl) {
            return {
              ...item,
              url: formatUrl.startsWith("http") ? formatUrl : `${apiUrl}${formatUrl}`,
            }
          }
        }

        // If the item has a direct file URL
        if (item.file && item.file.url) {
          return {
            ...item,
            url: item.file.url.startsWith("http") ? item.file.url : `${apiUrl}${item.file.url}`,
          }
        }

        // If the item has attributes with URL (for Strapi v4 structure)
        if (item.attributes && item.attributes.url) {
          return {
            ...item,
            url: item.attributes.url.startsWith("http") ? item.attributes.url : `${apiUrl}${item.attributes.url}`,
          }
        }

        // If we have a data structure from Strapi v5
        if (item.data && item.data.attributes) {
          const attrs = item.data.attributes
          const fileData = attrs.file && attrs.file.data ? attrs.file.data.attributes : null

          if (fileData && fileData.url) {
            return {
              id: item.data.id,
              type: attrs.type || "image",
              url: fileData.url.startsWith("http") ? fileData.url : `${apiUrl}${fileData.url}`,
            }
          }
        }

        // Return the item as is if we couldn't process it
        return item
      })
    }

    // Create the final post object with processed media items
    const finalPost = {
      ...postWithDocumentId,
      mediaItems: processedMediaItems.length > 0 ? processedMediaItems : postWithDocumentId.mediaItems || [],
    }

    setPosts((prevPosts) => [finalPost, ...prevPosts])
    setIsCreatePostModalOpen(false)

    toast({
      title: "Post created",
      description: "Your post has been published successfully!",
      variant: "default",
    })

    // Refresh the feed after a short delay to ensure images are loaded
    setTimeout(() => {
      loadInitialPosts()
    }, 2000)
  }

  const handlePostDeleted = (postId: number) => {
    // Remove the deleted post from the UI immediately
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))

    // Show success toast
    toast({
      title: "Post deleted",
      description: "Your post has been removed.",
      variant: "default",
    })

    // Optionally, you can trigger a background refresh of the feed
    // to ensure the UI is in sync with the backend
    // This is done without blocking the UI
    setTimeout(() => {
      loadInitialPosts().catch(console.error)
    }, 2000)
  }

  const handlePostUpdated = (updatedPost: PostType) => {
    // Ensure the updated post has a documentId and properly formatted mediaItems
    const postWithDocumentId = {
      ...updatedPost,
      documentId: updatedPost.documentId || `post-${updatedPost.id}`,
      // Ensure mediaItems are properly formatted
      mediaItems:
        updatedPost.mediaItems?.map((item) => ({
          ...item,
          url:
            item.url ||
            (item.file?.formats?.medium?.url
              ? `${API_BASE_URL}${item.file.formats.medium.url}`
              : item.file?.formats?.small?.url
                ? `${API_BASE_URL}${item.file.formats.small.url}`
                : item.file?.formats?.thumbnail?.url
                  ? `${API_BASE_URL}${item.file.formats.thumbnail.url}`
                  : ""),
        })) || [],
      // Ensure galleryLayout has a default value
      galleryLayout: updatedPost.galleryLayout || "grid",
    }

    setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? postWithDocumentId : post)))

    toast({
      title: "Post updated",
      description: "Your post has been updated successfully!",
      variant: "default",
    })
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    loadInitialPosts()
  }

  // Don't show the regular feed if search results are being displayed
  if (isSearching) return null

  return (
    <div className="space-y-6">
      {/* API Error Display */}
      {apiError && (
        <div
          className={`${isConnectionError ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-red-50 border-red-200 text-red-700"} px-4 py-3 rounded-lg mb-6 border`}
        >
          <div className="flex items-center">
            {isConnectionError ? <WifiOff className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
            <p className="font-medium">{isConnectionError ? "Connection Issue" : "Error loading posts"}</p>
          </div>
          <p className="text-sm mt-1">{apiError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 bg-transparent"
            onClick={handleRetry}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </>
            )}
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Feed</h2>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 bg-transparent">
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
            onClick={() => {
              if (isAuthenticated) {
                setIsCreatePostModalOpen(true)
              } else {
                router.push("/auth")
              }
            }}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg h-12"
            disabled={isConnectionError}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Post
          </Button>
        </motion.div>

        <div className="divide-y divide-gray-100">
          {isLoading && posts.length === 0 ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <AnimatePresence>
              <ReactionProvider>
                {posts.map((post, index) => (
                  <motion.div
                    key={`${post.id}-${index}`}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.1, 0.5) }}
                    exit={{ opacity: 0, y: -50 }}
                  >
                    <Post
                      post={post}
                      viewMode={viewMode}
                      onPostDeleted={handlePostDeleted}
                      onPostUpdated={handlePostUpdated}
                    />
                  </motion.div>
                ))}
              </ReactionProvider>
            </AnimatePresence>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No posts found. Create your first post or check back later!</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 bg-transparent"
                onClick={handleRetry}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {hasMore && <LoadMorePosts onLoadMore={loadMorePosts} isLoading={isLoading} hasMore={hasMore} />}
      </div>

      {isCreatePostModalOpen && (
        <CreatePostModal onClose={() => setIsCreatePostModalOpen(false)} onPostCreated={handlePostCreated} />
      )}
    </div>
  )
}
