"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, X, MessageCircle, Reply, Edit, Trash2, MoreVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CommentsService, type Comment } from "@/lib/services/comments-service"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface FeedCommentSectionProps {
  postId: string | number
  documentId?: string
  allowViewingForAll?: boolean
  onCommentAdded?: () => void
  onCommentDeleted?: () => void
  onCommentEdited?: () => void
}

// Valid report reason types for Strapi Comments plugin
type ReportReason = "BAD_LANGUAGE" | "DISCRIMINATION" | "OTHER"

const getNameInitials = (name: string): string => {
  if (!name || name === "Anonymous") return "AN"

  // For names with spaces (first and last name)
  if (name.includes(" ")) {
    const nameParts = name.split(" ")
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }

  // For single names or usernames
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase()
  }

  // For very short names
  return name.toUpperCase()
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return "just now"
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`

    return date.toLocaleDateString()
  } catch (error) {
    return dateString || "unknown date"
  }
}

export default function FeedCommentSection({
  postId,
  documentId,
  allowViewingForAll = true,
  onCommentAdded,
  onCommentDeleted,
  onCommentEdited,
}: FeedCommentSectionProps) {
  const authContext = useAuth()
  const user = authContext?.user || null
  const isAuthenticated = authContext?.isAuthenticated || false

  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null)
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [totalComments, setTotalComments] = useState(0)
  const [editingComment, setEditingComment] = useState<{ id: number; content: string } | null>(null)

  const { toast } = useToast()
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [pageSize] = useState(5) // Fixed page size of 5 comments per batch
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const initialFetchCompleted = useRef(false)

  // Parse error message from various error formats
  const parseErrorMessage = (err: any): string => {
    // Check for 403 Forbidden error specifically
    if (err?.error?.status === 403 || err?.status === 403) {
      return "You need to be logged in to perform this action. Please sign in to continue."
    }

    if (typeof err === "string") return err
    if (err instanceof Error) return err.message
    if (err?.error?.message) return err.error.message
    if (err?.message) return err.message
    if (err?.data?.error?.message) return err.data.error.message

    // For Strapi's error format
    if (err?.error?.details?.errors && Array.isArray(err.error.details.errors)) {
      return err.error.details.errors.map((e: any) => e.message).join(", ")
    }

    return "An unknown error occurred"
  }

  const fetchComments = async (pageNum = 1, reset = false) => {
    try {
      console.log("[v0] Fetching comments for post:", { postId, documentId, pageNum, reset })

      // Skip fetching if we don't have a valid post ID
      if (!postId && !documentId) {
        console.log("[v0] Skipping comment fetch - no valid post ID")
        setIsLoading(false)
        setComments([])
        setTotalComments(0)
        return
      }

      if (reset) {
        setIsLoading(true)
      } else {
        setIsFetchingMore(true)
      }

      setError(null)

      // Use the documentId if available, otherwise use numeric ID
      const identifier = documentId || postId

      const response = await CommentsService.getComments(postId, identifier.toString(), pageNum, pageSize)
      console.log("[v0] Fetched comments for page", pageNum, ":", response)

      const commentsData = response.data || []
      const pagination = response.pagination

      // Update pagination state
      if (pagination) {
        setHasMore(pagination.page < pagination.pageCount)
        // Calculate total comments including nested replies
        const totalCount = CommentsService.countTotalComments(commentsData)
        setTotalComments(totalCount)
      } else {
        // If no pagination info, calculate total from the data
        const total = CommentsService.countTotalComments(commentsData)
        setTotalComments(total)
        setHasMore(false)
      }

      if (reset) {
        // Replace all comments
        setComments(commentsData)
        setPage(1)
      } else {
        // Merge new comments with existing ones, avoiding duplicates
        const existingIds = new Set(comments.map((comment) => comment.id))
        const uniqueNewComments = commentsData.filter((comment: Comment) => !existingIds.has(comment.id))

        setComments((prevComments) => [...prevComments, ...uniqueNewComments])
      }

      // Mark initial fetch as completed
      initialFetchCompleted.current = true
    } catch (err) {
      console.error("[v0] Error fetching comments:", err)
      const isAuthError = err?.error?.status === 403 || err?.status === 403

      if (isAuthError) {
        // Don't show error to user, just show empty state
        setComments([])
        setTotalComments(0)
      } else {
        // For other errors, show a user-friendly message
        setError("Unable to load comments at this time. Please try again later.")
      }
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }

  // Fetch comments immediately when component mounts
  useEffect(() => {
    console.log("[v0] Comments component mounting with:", { postId, documentId })

    // Skip fetching if we don't have a valid post ID
    if (!postId && !documentId) {
      console.log("[v0] Skipping comment fetch - no valid post ID")
      setIsLoading(false)
      return
    }

    // Only fetch if we haven't already completed the initial fetch
    if (!initialFetchCompleted.current) {
      fetchComments(1, true)
    }

    // Clean up function
    return () => {
      // Cancel any pending requests if component unmounts
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [postId, documentId])

  // Scroll to bottom when new comment is added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [comments.length])

  // Focus input when replying or editing
  useEffect(() => {
    if ((replyTo || editingComment) && commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }, [replyTo, editingComment])

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    // Create a new IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        // If the load more element is visible and we have more comments to load
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          loadMoreComments()
        }
      },
      { threshold: 0.1 }, // Trigger when 10% of the element is visible
    )

    observerRef.current = observer

    // Observe the load more element if it exists
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    // Clean up the observer when component unmounts
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isFetchingMore, page])

  const loadMoreComments = () => {
    if (!hasMore || isFetchingMore) return

    const nextPage = page + 1
    console.log(`Loading more comments (page ${nextPage})`)
    setPage(nextPage)
    fetchComments(nextPage)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    if (!isAuthenticated) {
      setError("You need to be logged in to comment. Please sign in to continue.")
      toast({
        title: "Authentication required",
        description: "Please sign in to comment on posts",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // If we're editing a comment
      if (editingComment) {
        const response = await CommentsService.updateComment(postId, documentId, editingComment.id, newComment)

        // Check if the response indicates an error
        if (!response.success && response.error) {
          throw new Error(response.error)
        }

        // Reset form state
        setNewComment("")
        setEditingComment(null)

        // Refresh comments to get the updated hierarchical structure
        await fetchComments(1, true)

        // Notify parent component
        if (onCommentEdited) {
          onCommentEdited()
        }

        // Show success toast
        toast({
          title: "Comment updated",
          description: "Your comment has been successfully updated",
        })
      } else {
        // Submit a new comment or reply
        const response = await CommentsService.addComment(postId, documentId, newComment, replyTo?.id)

        // Check if the response indicates an error
        if (!response.success && response.error) {
          throw new Error(response.error)
        }

        // Reset form state
        setNewComment("")
        setReplyTo(null)

        // Refresh comments to get the updated hierarchical structure
        await fetchComments(1, true)

        // Notify parent component
        if (onCommentAdded) {
          onCommentAdded()
        }

        // Show success toast
        toast({
          title: "Comment posted",
          description: "Your comment has been successfully posted",
        })
      }
    } catch (err) {
      const errorMessage = parseErrorMessage(err)
      setError(errorMessage)

      toast({
        title: editingComment ? "Error updating comment" : "Error posting comment",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplyToComment = (commentId: number, username: string) => {
    setReplyTo({ id: commentId, username })
    setEditingComment(null)
    if (commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }

  const handleEditComment = (commentId: number, content: string) => {
    setEditingComment({ id: commentId, content })
    setNewComment(content)
    setReplyTo(null)
    if (commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }

  // Confirm delete dialog
  const confirmDeleteComment = (commentId: number) => {
    setCommentToDelete(commentId)
  }

  // Cancel delete
  const cancelDeleteComment = () => {
    setCommentToDelete(null)
  }

  // Proceed with deletion after confirmation
  const proceedWithDelete = async () => {
    if (!commentToDelete) return

    setIsDeleting(true)
    await performDeleteComment(commentToDelete)
    setCommentToDelete(null)
    setIsDeleting(false)
  }

  // Helper function to find a comment by ID in the nested structure
  const findCommentById = (comments: Comment[], id: number): Comment | null => {
    for (const comment of comments) {
      if (comment.id === id) {
        return comment
      }

      if (comment.children && comment.children.length > 0) {
        const found = findCommentById(comment.children, id)
        if (found) {
          return found
        }
      }
    }

    return null
  }

  // Actual delete operation
  const performDeleteComment = async (commentId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete comments",
        variant: "destructive",
      })
      return
    }

    setError(null)

    try {
      // Find the comment to get its author information
      const commentToDelete = findCommentById(comments, commentId)

      if (!commentToDelete) {
        throw new Error("Comment not found")
      }

      // Get the author ID from the comment
      const authorId = commentToDelete.author?.id

      if (!authorId) {
        throw new Error("Author ID not found in comment data")
      }

      // Delete the comment
      const response = await CommentsService.deleteComment(postId, documentId, commentId, authorId)

      if (!response.success) {
        throw new Error(response.error || "Failed to delete comment")
      }

      // Refresh comments to get the updated hierarchical structure
      await fetchComments(1, true)

      // Notify parent component
      if (onCommentDeleted) {
        onCommentDeleted()
      }

      // Show success toast
      toast({
        title: "Comment deleted",
        description: "Your comment has been successfully deleted",
      })
    } catch (err) {
      const errorMessage = parseErrorMessage(err)

      toast({
        title: "Error deleting comment",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleReportComment = async (commentId: number, reason: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report comments",
        variant: "destructive",
      })
      return
    }

    setError(null)

    try {
      // Ensure reason is one of the valid enum values
      let validReason: ReportReason = "OTHER"

      if (["BAD_LANGUAGE", "DISCRIMINATION", "OTHER"].includes(reason)) {
        validReason = reason as ReportReason
      }

      // Report the comment with a valid reason
      const response = await CommentsService.reportCommentAbuse(
        postId,
        documentId,
        commentId,
        validReason,
        `User reported: ${reason}`,
      )

      // Check if the response indicates an error
      if (!response.success && response.error) {
        throw new Error(response.error)
      }

      // Show success toast
      toast({
        title: "Comment reported",
        description: "Thank you for reporting this comment. Our team will review it.",
      })
    } catch (err) {
      const errorMessage = parseErrorMessage(err)

      toast({
        title: "Error reporting comment",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const dismissError = () => {
    setError(null)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setNewComment("")
  }

  // Check if the user can view comments
  const canViewComments = isAuthenticated || allowViewingForAll

  // Recursive function to render comments and their children
  const renderCommentWithReplies = (comment: Comment, level = 0) => {
    const isAuthor = user?.id === comment.author.id
    const formattedDate = formatDate(comment.createdAt)

    return (
      <div key={comment.id} className={`mt-4 ${level > 0 ? "ml-6 border-l-2 border-gray-100 pl-4" : ""}`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage
              src={comment.author.avatar || ""}
              alt={comment.author.name}
              onError={(e) => {
                // Hide the image on error
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
            <AvatarFallback className="bg-pink-100 text-pink-800">
              {getNameInitials(comment.author.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium">{comment.author.name}</p>
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Comment options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => confirmDeleteComment(comment.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>

            <div className="flex items-center mt-1 text-xs text-gray-500">
              <span>{formattedDate}</span>
              <span className="mx-2">•</span>
              <button
                onClick={() => handleReplyToComment(comment.id, comment.author.name)}
                className="flex items-center hover:text-pink-500"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </button>
              {!isAuthor && (
                <>
                  <span className="mx-2">•</span>
                  <button onClick={() => handleReportComment(comment.id, "OTHER")} className="hover:text-pink-500">
                    Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Render child comments */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-2">
            {comment.children.map((childComment) => renderCommentWithReplies(childComment, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // Load more indicator component
  const LoadMoreIndicator = () => {
    if (!hasMore) return null

    return (
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingMore ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-pink-500 mb-2" />
            <span className="text-sm text-gray-500">Loading more comments...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 mb-2">Scroll for more comments</span>
          </div>
        )}
      </div>
    )
  }

  if (!canViewComments) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-pink-500" />
        <p className="text-sm">
          Please{" "}
          <Link href="/auth" className="text-pink-500 font-medium hover:underline">
            sign in
          </Link>{" "}
          to view and post comments.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {/* Comment count */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">
          {totalComments} {totalComments === 1 ? "Comment" : "Comments"}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>
              {error.includes("logged in") || error.includes("sign in")
                ? "You need to be logged in to add comments, but you can still view existing comments."
                : error}
            </span>
            {(error.includes("logged in") || error.includes("sign in")) && (
              <Button variant="link" size="sm" className="px-1 h-auto text-red-700 underline" asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={dismissError} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        {replyTo && (
          <div className="bg-gray-50 rounded-lg p-2 mb-2 flex items-center">
            <p className="text-xs flex-1">
              Replying to <span className="font-medium text-pink-500">@{replyTo.username}</span>
            </p>
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {editingComment && (
          <div className="bg-gray-50 rounded-lg p-2 mb-2 flex items-center">
            <p className="text-xs flex-1">Editing your comment</p>
            <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage
              src={user?.avatar || ""}
              alt={user?.username || "User"}
              onError={(e) => {
                // Hide the image on error
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
            <AvatarFallback className="bg-pink-100 text-pink-800 text-lg">
              {getNameInitials(user?.username || user?.name || "U")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 relative">
            <Textarea
              ref={commentInputRef}
              placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Write a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting || !isAuthenticated}
              className="resize-none pr-12 min-h-[50px] py-3 rounded-full"
              rows={1}
              aria-label="Comment input"
              aria-invalid={!!error}
              aria-describedby={error ? "comment-error" : undefined}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSubmitting || !newComment.trim() || !isAuthenticated}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full p-0"
              aria-label={isSubmitting ? "Submitting comment" : "Submit comment"}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 rotate-45"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </Button>
          </div>
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Please{" "}
            <Link href="/auth" className="text-pink-500 hover:underline">
              sign in
            </Link>{" "}
            to add a comment to this post.
          </p>
        )}
      </form>

      {/* Comments list */}
      <div className="max-h-[500px] overflow-y-auto mb-4 pr-1">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="h-20 bg-gray-100 rounded-lg w-full" />
                  <div className="h-4 bg-gray-100 rounded w-24 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : Array.isArray(comments) && comments.length > 0 ? (
          <div>
            {comments.map((comment) => renderCommentWithReplies(comment))}
            <LoadMoreIndicator />
            <div ref={commentsEndRef} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-2xl text-gray-400 mb-2">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={commentToDelete !== null} onOpenChange={(open) => !open && cancelDeleteComment()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
