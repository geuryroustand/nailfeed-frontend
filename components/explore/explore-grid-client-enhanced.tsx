"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ExplorePostWithLiked } from "@/lib/explore-data"
import { likePost, unlikePost, savePost, unsavePost, addComment, fetchMorePosts } from "@/lib/explore-actions"
import LoadMoreIndicator from "./load-more-indicator"
import Link from "next/link"
import { lazy, Suspense } from "react"

// Lazy load the modal for better performance
const PostDetailModal = lazy(() => import("./post-detail-modal-enhanced"))

interface ExploreGridClientEnhancedProps {
  initialPosts: ExplorePostWithLiked[]
  initialNextCursor: string | null
  initialHasMore: boolean
  searchQuery: string
  category: string
}

export default function ExploreGridClientEnhanced({
  initialPosts,
  initialNextCursor,
  initialHasMore,
  searchQuery,
  category,
}: ExploreGridClientEnhancedProps) {
  const [selectedPost, setSelectedPost] = useState<ExplorePostWithLiked | null>()
  const [posts, setPosts] = useState<ExplorePostWithLiked[]>(initialPosts)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Reference to the observer target element
  const observerTarget = useRef<HTMLDivElement>(null)

  // Reset posts when search/category changes
  useEffect(() => {
    setPosts(initialPosts)
    setNextCursor(initialNextCursor)
    setHasMore(initialHasMore)
    setError(null)
  }, [initialPosts, initialNextCursor, initialHasMore, searchQuery, category])

  // Function to load more posts
  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchMorePosts(nextCursor, { query: searchQuery, category })

      if (result.success) {
        setPosts((prevPosts) => [...prevPosts, ...result.posts])
        setNextCursor(result.nextCursor)
        setHasMore(result.hasMore)
      } else {
        setError("Failed to load more posts. Please try again.")
        toast({
          title: "Error",
          description: result.error || "Failed to load more posts",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [nextCursor, isLoading, hasMore, toast, searchQuery, category])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 },
    )

    const currentTarget = observerTarget.current

    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMorePosts, hasMore, isLoading])

  // Optimized handlers with better error handling
  const handleLike = useCallback(
    async (post: ExplorePostWithLiked) => {
      // Optimistic update
      setPosts((currentPosts) =>
        currentPosts.map((p) =>
          p.id === post.id
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked ? p.likes - 1 : p.likes + 1,
              }
            : p,
        ),
      )

      // If selected post is the one being liked, update it too
      if (selectedPost?.id === post.id) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                isLiked: !prev.isLiked,
                likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
              }
            : null,
        )
      }

      // Server action
      const result = await (post.isLiked ? unlikePost(post.id) : likePost(post.id))

      if (!result.success) {
        // Revert optimistic update on failure
        setPosts((currentPosts) =>
          currentPosts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  isLiked: post.isLiked,
                  likes: post.isLiked ? post.likes : post.likes - 1,
                }
              : p,
          ),
        )

        if (selectedPost?.id === post.id) {
          setSelectedPost((prev) =>
            prev
              ? {
                  ...prev,
                  isLiked: post.isLiked,
                  likes: post.isLiked ? post.likes : post.likes - 1,
                }
              : null,
          )
        }

        toast({
          title: "Error",
          description: result.error || "Failed to update like status",
          variant: "destructive",
        })
      }
    },
    [selectedPost, toast],
  )

  const handleSave = useCallback(
    async (post: ExplorePostWithLiked) => {
      // Optimistic update
      setPosts((currentPosts) => currentPosts.map((p) => (p.id === post.id ? { ...p, isSaved: !p.isSaved } : p)))

      // If selected post is the one being saved, update it too
      if (selectedPost?.id === post.id) {
        setSelectedPost((prev) => (prev ? { ...prev, isSaved: !prev.isSaved } : null))
      }

      // Server action
      const result = await (post.isSaved ? unsavePost(post.id) : savePost(post.id))

      if (!result.success) {
        // Revert optimistic update on failure
        setPosts((currentPosts) => currentPosts.map((p) => (p.id === post.id ? { ...p, isSaved: post.isSaved } : p)))

        if (selectedPost?.id === post.id) {
          setSelectedPost((prev) => (prev ? { ...prev, isSaved: post.isSaved } : null))
        }

        toast({
          title: "Error",
          description: result.error || "Failed to update save status",
          variant: "destructive",
        })
      }
    },
    [selectedPost, toast],
  )

  const handleAddComment = useCallback(
    async (postId: number, comment: string) => {
      const result = await addComment(postId, comment)

      if (result.success) {
        // Optimistic update for comment count
        setPosts((currentPosts) => currentPosts.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)))

        if (selectedPost?.id === postId) {
          setSelectedPost((prev) => (prev ? { ...prev, comments: prev.comments + 1 } : null))
        }

        return result.comment
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add comment",
          variant: "destructive",
        })
        return null
      }
    },
    [selectedPost, toast],
  )

  // Memoize the grid items for better performance
  const gridItems = useMemo(
    () =>
      posts.map((post, index) => (
        <ExploreGridItem
          key={`${post.id}-${post.documentId}`}
          post={post}
          index={index}
          onClick={() => setSelectedPost(post)}
        />
      )),
    [posts],
  )

  // If there are no posts and no error, show a message
  if (posts.length === 0 && !error && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {searchQuery || category !== "all"
            ? "No posts match your search criteria. Try adjusting your filters."
            : "No posts found. Check back later for new content."}
        </p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4"
      >
        {gridItems}
      </motion.div>

      {/* Intersection observer target for infinite scroll */}
      <div ref={observerTarget} className="w-full h-20 mt-4">
        {hasMore && <LoadMoreIndicator isLoading={isLoading} />}
      </div>

      {selectedPost && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          }
        >
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onLike={() => handleLike(selectedPost)}
            onSave={() => handleSave(selectedPost)}
            onAddComment={(comment) => handleAddComment(selectedPost.id, comment)}
          />
        </Suspense>
      )}
    </>
  )
}

// Memoized grid item component for better performance
const ExploreGridItem = React.memo<{
  post: ExplorePostWithLiked
  index: number
  onClick: () => void
}>(({ post, index, onClick }) => {
  const [imageError, setImageError] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    // If the user clicks with the middle mouse button or Ctrl+click, let the browser handle it
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return
    }

    e.preventDefault()
    onClick()
  }

  const imageUrl = post.image || "/intricate-nail-art.png"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 1.5) }}
      whileHover={{ scale: 0.98 }}
      className="relative aspect-square cursor-pointer group overflow-hidden"
    >
      <Link href={`/post/${post.documentId || post.id}`} onClick={handleClick}>
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-sm text-gray-500">Image unavailable</p>
          </div>
        ) : (
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={post.description || `Nail art by ${post.username}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center space-x-4 text-white">
            <div className="flex items-center">
              <Heart className={`h-5 w-5 mr-1 ${post.isLiked ? "fill-white" : ""}`} />
              <span className="text-sm font-medium">{post.likes}</span>
            </div>
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">{post.comments}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
})

ExploreGridItem.displayName = "ExploreGridItem"
