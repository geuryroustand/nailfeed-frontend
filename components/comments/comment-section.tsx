"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { type Comment, commentsService } from "@/lib/services/comments-service"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import CommentItem from "./comment-item"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"

interface CommentSectionProps {
  relatedTo: string
  relatedId: string | number
  className?: string
}

export default function CommentSection({ relatedTo, relatedId, className = "" }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalComments, setTotalComments] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchComments = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        setIsLoading(pageNum === 1)
        if (pageNum > 1) setIsLoadingMore(true)

        const response = await commentsService.getComments(relatedTo, relatedId, pageNum)

        // Update total comments count from the response
        setTotalComments(response.meta.totalComments || 0)

        // Check if there are more pages
        const { page, pageCount } = response.meta.pagination
        setHasMore(page < pageCount)

        // Update comments state
        if (append) {
          // Append new comments to existing ones, avoiding duplicates
          setComments((prev) => {
            const existingIds = new Set(prev.map((c) => c.id))
            const newComments = response.data.filter((c) => !existingIds.has(c.id))
            return [...prev, ...newComments]
          })
        } else {
          setComments(response.data)
        }

        setError(null)
      } catch (err) {
        setError("Failed to load comments. Please try again.")
        console.error("Error fetching comments:", err)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [relatedTo, relatedId],
  )

  const loadMoreComments = useCallback(() => {
    if (!hasMore || isLoadingMore) return
    setPage((prevPage) => {
      const nextPage = prevPage + 1
      fetchComments(nextPage, true)
      return nextPage
    })
  }, [fetchComments, hasMore, isLoadingMore])

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreComments()
        }
      },
      { threshold: 0.5 },
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, loadMoreComments])

  // Fetch comments immediately when component mounts
  useEffect(() => {
    // Immediate fetch on mount
    fetchComments()

    // Clean up function
    return () => {
      // Cancel any pending requests if component unmounts
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return

    try {
      setIsSubmitting(true)
      await commentsService.addComment(newComment, relatedTo, relatedId)
      setNewComment("")
      // Refresh comments and update count
      fetchComments()
    } catch (err) {
      setError("Failed to post comment. Please try again.")
      console.error("Error posting comment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentUpdate = async (id: number, content: string) => {
    try {
      await commentsService.updateComment(id, content)
      // Update the comment in the state
      setComments((prevComments) =>
        prevComments.map((comment) => (comment.id === id ? { ...comment, content } : comment)),
      )
    } catch (err) {
      console.error("Error updating comment:", err)
    }
  }

  const handleCommentDelete = async (id: number) => {
    try {
      await commentsService.deleteComment(id)
      // Remove the comment from the state and update count
      setComments((prevComments) => prevComments.filter((comment) => comment.id !== id))
      setTotalComments((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Error deleting comment:", err)
    }
  }

  const handleReplyAdded = (parentId: number, newReply: Comment) => {
    // Update the comments state to include the new reply
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            }
          : comment,
      ),
    )

    // Increment the total comment count
    setTotalComments((prev) => prev + 1)
  }

  const handleReplyDeleted = (parentId: number, replyId: number) => {
    // Update the comments state to remove the deleted reply
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: (comment.replies || []).filter((reply) => reply.id !== replyId),
            }
          : comment,
      ),
    )

    // Decrement the total comment count
    setTotalComments((prev) => Math.max(0, prev - 1))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({totalComments})
        </h3>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-gray-100 text-gray-700 rounded-md">Please sign in to leave a comment.</div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
              onReplyAdded={handleReplyAdded}
              onReplyDeleted={handleReplyDeleted}
              relatedTo={relatedTo}
              relatedId={relatedId}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">No comments yet. Be the first to comment!</div>
        )}

        {/* Load more indicator */}
        {!isLoading && comments.length > 0 && (
          <div ref={loadMoreRef} className="py-2 text-center">
            {isLoadingMore ? (
              <div className="flex justify-center items-center space-x-2">
                <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                <span>Loading more comments...</span>
              </div>
            ) : hasMore ? (
              <div className="text-sm text-gray-500">Scroll for more comments</div>
            ) : (
              <p className="text-sm text-gray-500">
                {comments.length > 0 ? "You've reached the end of the comments." : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
