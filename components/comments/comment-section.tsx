"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { type Comment, commentsService } from "@/lib/services/comments-service"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import CommentItem from "./comment-item"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, ImageIcon, X } from "lucide-react"

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.")
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB.")
      return
    }

    setSelectedImage(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setError(null)
  }, [])

  const handleRemoveImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [imagePreview])

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const fetchComments = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        setIsLoading(pageNum === 1)
        if (pageNum > 1) setIsLoadingMore(true)

        const response = await commentsService.getComments(relatedTo, relatedId, pageNum)

        setTotalComments(response.meta.totalComments || 0)

        const { page, pageCount } = response.meta.pagination
        setHasMore(page < pageCount)

        if (append) {
          setComments((prev) => {
            const existingIds = new Set(prev.map((c) => c.id))
            const newComments = response.data.filter((c) => !existingIds.has(c.id))
            return [...prev, ...newComments]
          })
        } else {
          setComments(response.data)
        }

        setError(null)
      } catch (err: any) {
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

  useEffect(() => {
    fetchComments()

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newComment.trim() && !selectedImage) || !isAuthenticated) return

    try {
      setIsSubmitting(true)

      let attachmentId = null
      if (selectedImage) {
        setIsUploadingImage(true)
        const token = user?.token || localStorage.getItem("jwt") || localStorage.getItem("authToken")
        if (!token) {
          throw new Error("Authentication token not found")
        }

        const formData = new FormData()
        formData.append("files", selectedImage)

        const uploadResponse = await fetch("/api/auth-proxy/upload?endpoint=/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`Upload failed: ${errorText}`)
        }

        const uploadResult = await uploadResponse.json()
        if (Array.isArray(uploadResult) && uploadResult.length > 0) {
          attachmentId = uploadResult[0].id
        } else {
          throw new Error("Invalid upload response")
        }
        setIsUploadingImage(false)
      }

      await commentsService.addComment(newComment.trim() || "", relatedTo, relatedId, undefined, attachmentId)

      setNewComment("")
      handleRemoveImage()

      fetchComments()
    } catch (err: any) {
      setError("Failed to post comment. Please try again.")
      console.error("Error posting comment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentUpdate = async (id: number, content: string) => {
    try {
      await commentsService.updateComment(id, content)
      setComments((prevComments) =>
        prevComments.map((comment) => (comment.id === id ? { ...comment, content } : comment)),
      )
    } catch (err: any) {
      console.error("Error updating comment:", err)
    }
  }

  const handleCommentDelete = async (id: number) => {
    try {
      await commentsService.deleteComment(id)
      setComments((prevComments) => prevComments.filter((comment) => comment.id !== id))
      setTotalComments((prev) => Math.max(0, prev - 1))
    } catch (err: any) {
      console.error("Error deleting comment:", err)
    }
  }

  const handleReplyAdded = (parentId: number, newReply: Comment) => {
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

    setTotalComments((prev) => prev + 1)
  }

  const handleReplyDeleted = (parentId: number, replyId: number) => {
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
              disabled={isSubmitting}
              aria-label="Comment text"
            />

            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Comment attachment preview"
                  className="max-w-xs max-h-32 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Remove image attachment"
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="sr-only"
                id="comment-image-upload"
                disabled={isSubmitting}
                aria-describedby="image-upload-help"
              />
              <label
                htmlFor="comment-image-upload"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Upload image attachment"
              >
                <ImageIcon className="h-4 w-4" />
                {selectedImage ? "Change Image" : "Add Image"}
              </label>
              <span id="image-upload-help" className="sr-only">
                Upload an image to attach to your comment. Maximum file size is 5MB.
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isUploadingImage || (!newComment.trim() && !selectedImage)}
              aria-label={isSubmitting ? "Posting comment..." : "Post comment"}
            >
              {isSubmitting ? (isUploadingImage ? "Uploading..." : "Posting...") : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-gray-100 text-gray-700 rounded-md">Please sign in to leave a comment.</div>
      )}

      <div className="space-y-4">
        {isLoading ? (
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
