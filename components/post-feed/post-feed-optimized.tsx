"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import type { Post as PostType } from "@/lib/post-data"
import { useAuth } from "@/context/auth-context"
import { useSearch } from "@/context/search-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { fetchPostsAction, refreshPostsAction } from "@/lib/actions/post-server-actions"

// Code split non-critical components
const CreatePostModal = dynamic(() => import("@/components/create-post-modal"), {
  loading: () => null,
  ssr: false,
})

const LoadMorePosts = dynamic(() => import("@/components/load-more-posts"), {
  loading: () => <div className="animate-pulse h-12 bg-gray-200 rounded" />,
  ssr: false,
})

// Import split components
import PostFeedHeader from "./post-feed-header"
import PostFeedError from "./post-feed-error"
import PostFeedCreateButton from "./post-feed-create-button"
import PostFeedEmptyState from "./post-feed-empty-state"
import PostFeedSkeleton from "./post-feed-skeleton"
import PostList from "./post-list"

interface PostFeedOptimizedProps {
  initialPosts?: PostType[]
  initialHasMore?: boolean
  initialNextPage?: number
  initialError?: {
    code: number | string
    message: string
  }
}

export default function PostFeedOptimized({
  initialPosts,
  initialHasMore = true,
  initialNextPage = 1,
  initialError,
}: PostFeedOptimizedProps) {
  // State management
  const [posts, setPosts] = useState<PostType[]>(initialPosts || [])
  const [isLoading, setIsLoading] = useState(!initialPosts || initialPosts.length === 0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [nextPage, setNextPage] = useState(initialNextPage)
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards")
  const [apiError, setApiError] = useState<string | null>(initialError ? initialError.message : null)
  const [retryCount, setRetryCount] = useState(0)
  const [isConnectionError, setIsConnectionError] = useState(false)

  // Hooks
  const { isAuthenticated } = useAuth()
  const { isSearching } = useSearch()
  const { toast } = useToast()
  const router = useRouter()
  const isOffline = useRef(false)

  // Network status monitoring
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

  const invalidateServiceWorkerCache = useCallback(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "INVALIDATE_CACHE",
        pattern: "/api/posts",
      })
    }
  }, [])

  // Load initial posts
  const loadInitialPosts = useCallback(async () => {
    if (initialPosts && initialPosts.length > 0 && !initialError && retryCount === 0) {
      return
    }

    if (isOffline.current) {
      setApiError("You are currently offline. Please check your internet connection.")
      setIsConnectionError(true)
      return
    }

    if (initialError?.code === 429 && retryCount > 0) {
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000)
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
    }

    setIsLoading(true)
    setApiError(null)
    setIsConnectionError(false)

    invalidateServiceWorkerCache()

    try {
      const cacheBuster = Date.now()
      const response = await refreshPostsAction()

      if (response.error) {
        setApiError(response.error.message || "Error loading posts")

        if (response.posts && response.posts.length > 0) {
          setPosts(response.posts)
          setHasMore(false)
          setNextPage(undefined)
          return
        }

        if (response.error.code === 429) {
          const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 30000)
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, retryDelay)
        }

        return
      }

      const postsWithDocumentId = response.posts.map((post) => ({
        ...post,
        documentId: post.documentId || `post-${post.id}`,
      }))

      setPosts(postsWithDocumentId)
      setHasMore(response.hasMore)
      setNextPage(response.nextPage || 1)

      if (retryCount > 0) {
        setRetryCount(0)
      }
    } catch (error) {
      setApiError("Failed to load posts. Please try again later.")

      if (
        error instanceof Error &&
        (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("connection"))
      ) {
        setIsConnectionError(true)
        setApiError("Network error. Please check your connection and try again.")
      }

      toast({
        title: "Error loading posts",
        description: "We couldn't load the latest posts. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [initialPosts, initialError, retryCount, toast, invalidateServiceWorkerCache])

  // Load more posts
  const loadMorePosts = async () => {
    if (!hasMore || isLoading || isOffline.current) return

    setIsLoading(true)
    try {
      const offset = (nextPage - 1) * 6
      const response = await fetchPostsAction(6, offset)

      if (response.error) {
        setApiError(response.error.message || "Error loading more posts")
        toast({
          title: "Error loading more posts",
          description: response.error.message || "We couldn't load additional posts. Please try again later.",
          variant: "destructive",
        })
        return
      }

      const existingIds = new Set(posts.map((post) => post.id))
      const newPosts = response.posts.filter((post) => !existingIds.has(post.id))

      const newPostsWithDocumentId = newPosts.map((post) => ({
        ...post,
        documentId: post.documentId || `post-${post.id}`,
      }))

      setPosts((prevPosts) => [...prevPosts, ...newPostsWithDocumentId])
      setHasMore(response.hasMore)
      setNextPage(response.nextPage || nextPage + 1)
    } catch (error) {
      setApiError("Failed to load more posts. Please try again later.")

      if (
        error instanceof Error &&
        (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("connection"))
      ) {
        setIsConnectionError(true)
        setApiError("Network error. Please check your connection and try again.")
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

  // Event handlers
  const handlePostCreated = (newPost: PostType) => {
    const postWithDocumentId = {
      ...newPost,
      documentId: newPost.documentId || `post-${newPost.id}`,
    }

    setPosts((prevPosts) => [postWithDocumentId, ...prevPosts])
    setIsCreatePostModalOpen(false)

    toast({
      title: "Post created",
      description: "Your post has been published successfully!",
      variant: "default",
    })

    invalidateServiceWorkerCache()

    setTimeout(() => {
      loadInitialPosts()
    }, 500)
  }

  const handlePostDeleted = (postId: number) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))

    toast({
      title: "Post deleted",
      description: "Your post has been removed.",
      variant: "default",
    })

    setTimeout(() => {
      loadInitialPosts().catch(console.error)
    }, 2000)
  }

  const handlePostUpdated = (updatedPost: PostType) => {
    const postWithDocumentId = {
      ...updatedPost,
      documentId: updatedPost.documentId || `post-${updatedPost.id}`,
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

  const handleCreatePostClick = () => {
    if (isAuthenticated) {
      setIsCreatePostModalOpen(true)
    } else {
      router.push("/auth")
    }
  }

  // Initial load effect
  useEffect(() => {
    if (!initialPosts || initialPosts.length === 0 || initialError) {
      loadInitialPosts()
    }
  }, [initialPosts, initialError, loadInitialPosts])

  // Don't show the regular feed if search results are being displayed
  if (isSearching) return null

  return (
    <div className="space-y-6">
      {/* API Error Display */}
      {apiError && (
        <PostFeedError
          error={apiError}
          isConnectionError={isConnectionError}
          isLoading={isLoading}
          onRetry={handleRetry}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <PostFeedHeader viewMode={viewMode} onViewModeChange={setViewMode} />

        <PostFeedCreateButton onClick={handleCreatePostClick} disabled={isConnectionError} />

        {isLoading && posts.length === 0 ? (
          <PostFeedSkeleton />
        ) : posts.length > 0 ? (
          <PostList
            posts={posts}
            viewMode={viewMode}
            onPostDeleted={handlePostDeleted}
            onPostUpdated={handlePostUpdated}
          />
        ) : (
          <PostFeedEmptyState isLoading={isLoading} onRetry={handleRetry} />
        )}

        {hasMore && <LoadMorePosts onLoadMore={loadMorePosts} isLoading={isLoading} hasMore={hasMore} />}
      </div>

      {isCreatePostModalOpen && (
        <CreatePostModal onClose={() => setIsCreatePostModalOpen(false)} onPostCreated={handlePostCreated} />
      )}
    </div>
  )
}
