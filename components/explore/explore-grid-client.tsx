"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle } from "lucide-react"
import PostDetailModal from "@/components/explore/post-detail-modal"
import type { ExplorePostWithLiked } from "@/lib/explore-data"
import { likePost, unlikePost, savePost, unsavePost, addComment, fetchMorePosts } from "@/lib/explore-actions"
import { useToast } from "@/hooks/use-toast"
import LoadMoreIndicator from "./load-more-indicator"
import Link from "next/link"

interface ExploreGridClientProps {
  initialPosts: ExplorePostWithLiked[]
  initialNextCursor: string | null
  initialHasMore: boolean
}

export default function ExploreGridClient({ initialPosts, initialNextCursor, initialHasMore }: ExploreGridClientProps) {
  const [selectedPost, setSelectedPost] = useState<ExplorePostWithLiked | null>(null)
  const [posts, setPosts] = useState<ExplorePostWithLiked[]>(initialPosts)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { toast } = useToast()

  // Reference to the observer target element
  const observerTarget = useRef<HTMLDivElement>(null)

  // Function to load more posts
  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    try {
      const result = await fetchMorePosts(nextCursor)

      if (result.success) {
        setPosts((prevPosts) => [...prevPosts, ...result.posts])
        setNextCursor(result.nextCursor)
        setHasMore(result.hasMore)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load more posts",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [nextCursor, isLoading, hasMore, toast])

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

  const handleLike = async (post: ExplorePostWithLiked) => {
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
  }

  const handleSave = async (post: ExplorePostWithLiked) => {
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
  }

  const handleAddComment = async (postId: number, comment: string) => {
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
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4"
      >
        {posts.map((post, index) => (
          <ExploreGridItem key={post.id} post={post} index={index} onClick={() => setSelectedPost(post)} />
        ))}
      </motion.div>

      {/* Intersection observer target for infinite scroll */}
      <div ref={observerTarget} className="w-full h-20 mt-4">
        {hasMore && <LoadMoreIndicator isLoading={isLoading} />}
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={() => handleLike(selectedPost)}
          onSave={() => handleSave(selectedPost)}
          onAddComment={(comment) => handleAddComment(selectedPost.id, comment)}
        />
      )}
    </>
  )
}

interface ExploreGridItemProps {
  post: ExplorePostWithLiked
  index: number
  onClick: () => void
}

function ExploreGridItem({ post, index, onClick }: ExploreGridItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    // If the user clicks with the middle mouse button or Ctrl+click, let the browser handle it
    // This allows opening in a new tab
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return
    }

    e.preventDefault()
    onClick()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 1.5) }} // Cap the delay to avoid too long animations
      whileHover={{ scale: 0.98 }}
      className="relative aspect-square cursor-pointer group"
    >
      <Link href={`/post/${post.id}`} onClick={handleClick}>
        <img
          src={post.image || "/placeholder.svg"}
          alt={`Nail art by ${post.username}`}
          className="w-full h-full object-cover"
          loading="lazy" // Add lazy loading for better performance
        />
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
}
