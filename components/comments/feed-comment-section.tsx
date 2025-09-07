"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, X, MessageCircle, Reply, Edit, Trash2, MoreVertical, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CommentsService, type Comment } from "@/lib/services/comments-service"
import { MediaUploadService } from "@/lib/services/media-upload-service"
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
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([])
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

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

    if (!newComment.trim() && !imageFile) return

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

    const optimisticId = `temp-${Date.now()}`
    const optimisticComment: Comment = {
      id: Number.parseInt(optimisticId.replace("temp-", "")),
      documentId: optimisticId,
      content: newComment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: user?.id || 0,
        name: user?.username || user?.name || "You",
        email: user?.email || "",
        avatar: user?.avatar || "",
      },
      children: [],
      threadOf: replyTo?.id || null,
      attachment: imageFile
        ? {
            id: 0,
            url: URL.createObjectURL(imageFile),
            formats: {},
          }
        : undefined,
    }

    try {
      let attachmentId: number | undefined = undefined

      if (imageFile) {
        console.log("[v0] Uploading image before creating comment:", imageFile.name)
        try {
          const token = localStorage.getItem("authToken") || localStorage.getItem("jwt")
          const uploadResult = await MediaUploadService.uploadFiles([imageFile], token || undefined)

          if (uploadResult && uploadResult.length > 0 && uploadResult[0].id) {
            attachmentId = uploadResult[0].id
            console.log("[v0] Image uploaded successfully, file ID:", attachmentId)
          } else {
            throw new Error("Failed to get file ID from upload response")
          }
        } catch (uploadError) {
          console.error("[v0] Image upload failed:", uploadError)
          setError("Failed to upload image. Please try again.")
          setIsSubmitting(false)
          return
        }
      }

      const commentContent = newComment
      const replyToData = replyTo

      if (replyTo) {
        setComments((prevComments) => {
          const updateCommentReplies = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === replyTo.id) {
                return {
                  ...comment,
                  children: [...(comment.children || []), optimisticComment],
                }
              }
              if (comment.children && comment.children.length > 0) {
                return {
                  ...comment,
                  children: updateCommentReplies(comment.children),
                }
              }
              return comment
            })
          }
          return updateCommentReplies(prevComments)
        })
      } else {
        setComments((prevComments) => [optimisticComment, ...prevComments])
      }

      setSubmittingCommentId(optimisticId)
      setTotalComments((prev) => prev + 1)

      setNewComment("")
      setImageFile(null)
      const fileInput = document.getElementById("feed-comment-image-upload") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
      setReplyTo(null)

      if (editingComment) {
        console.log("[v0] Updating existing comment:", editingComment.id)
        const response = await CommentsService.updateComment(postId, documentId, editingComment.id, commentContent)

        if (!response.success && response.error) {
          throw new Error(response.error)
        }

        setEditingComment(null)

        const scrollContainer = document.querySelector(".max-h-\\[500px\\]")
        const scrollTop = scrollContainer?.scrollTop || 0

        await fetchComments(1, true)

        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop
        }

        if (onCommentEdited) {
          onCommentEdited()
        }

        toast({
          title: "Comment updated",
          description: "Your comment has been successfully updated",
        })
      } else {
        console.log("[v0] Creating new comment with data:", {
          postId,
          documentId,
          content: commentContent,
          replyTo: replyToData?.id,
          attachmentId,
        })

        const response = await CommentsService.addComment(
          postId,
          documentId,
          commentContent,
          replyToData?.id,
          attachmentId,
        )

        console.log("[v0] Comment creation response:", response)

        if (!response.success && response.error) {
          throw new Error(response.error)
        }

        if (response && !response.error) {
          onCommentAdded?.()

          toast({
            title: "Comment posted!",
            description: attachmentId
              ? "Your comment with image has been posted successfully."
              : "Your comment has been posted successfully.",
          })
        } else {
          throw new Error(response?.error || "Failed to post comment")
        }
      }
    } catch (error) {
      console.error("[v0] Error submitting comment:", error)

      setComments((prevComments) => {
        if (replyTo) {
          const removeOptimisticReply = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === replyTo.id) {
                return {
                  ...comment,
                  children: comment.children?.filter((child) => child.documentId !== optimisticId) || [],
                }
              }
              if (comment.children && comment.children.length > 0) {
                return {
                  ...comment,
                  children: removeOptimisticReply(comment.children),
                }
              }
              return comment
            })
          }
          return removeOptimisticReply(prevComments)
        } else {
          return prevComments.filter((comment) => comment.documentId !== optimisticId)
        }
      })

      setTotalComments((prev) => prev - 1)
      setError(error instanceof Error ? error.message : "Failed to post comment. Please try again.")

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setSubmittingCommentId(null)
      console.log("[v0] Comment submission completed, loading state cleared")
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
      console.log("[v0] Starting comment deletion process:", { commentId, postId, documentId })

      const commentToDelete = findCommentById(comments, commentId)

      if (!commentToDelete) {
        console.error("[v0] Comment not found in local state:", commentId)
        await fetchComments(1, true)
        throw new Error("Comment not found in local state. Comments have been refreshed.")
      }

      console.log("[v0] Found comment to delete:", {
        commentId: commentToDelete.id,
        commentDocumentId: commentToDelete.documentId,
        authorId: commentToDelete.author?.id,
        authorName: commentToDelete.author?.name,
        fullComment: commentToDelete,
        currentUser: {
          id: user?.id,
          username: user?.username,
          name: user?.name,
          email: user?.email,
        },
      })

      const authorId = commentToDelete.author?.id

      if (!authorId) {
        console.error("[v0] Author ID not found in comment data:", commentToDelete)
        throw new Error("Author ID not found in comment data")
      }

      const commentIdentifier = commentToDelete.id

      console.log("[v0] Validation check before deletion:", {
        postId,
        documentId,
        commentId,
        commentIdentifier,
        commentDocumentId: commentToDelete.documentId,
        authorId,
        authorIdType: typeof authorId,
        commentIdType: typeof commentId,
        commentIdentifierType: typeof commentIdentifier,
        isAuthorIdNumeric: /^\d+$/.test(String(authorId)),
        isCommentIdNumeric: /^\d+$/.test(String(commentId)),
      })

      console.log("[v0] Calling CommentsService.deleteComment with:", {
        postId,
        documentId,
        commentIdentifier,
        authorId,
      })

      const response = await CommentsService.deleteComment(postId, documentId, commentIdentifier, authorId)

      if (!response.success) {
        console.error("[v0] Delete comment failed:", response.error)
        throw new Error(response.error || "Failed to delete comment")
      }

      console.log("[v0] Comment deleted successfully, refreshing comments list")

      await fetchComments(1, true)

      if (onCommentDeleted) {
        onCommentDeleted()
      }

      toast({
        title: "Comment deleted",
        description: "Your comment has been successfully deleted",
      })
    } catch (err) {
      console.error("[v0] Error in performDeleteComment:", err)
      const errorMessage = parseErrorMessage(err)

      console.log("[v0] Refreshing comments after deletion error to ensure UI sync")
      try {
        await fetchComments(1, true)
      } catch (refreshError) {
        console.error("[v0] Failed to refresh comments after deletion error:", refreshError)
      }

      let userFriendlyMessage = errorMessage
      if (errorMessage.includes("Entity does not exist") || errorMessage.includes("not found")) {
        userFriendlyMessage =
          "This comment may have already been deleted or you don't have permission to delete it. The comments have been refreshed."
      } else if (errorMessage.includes("not allowed") || errorMessage.includes("403")) {
        userFriendlyMessage = "You don't have permission to delete this comment."
      }

      toast({
        title: "Error deleting comment",
        description: userFriendlyMessage,
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
      let validReason: ReportReason = "OTHER"

      if (["BAD_LANGUAGE", "DISCRIMINATION", "OTHER"].includes(reason)) {
        validReason = reason as ReportReason
      }

      const response = await CommentsService.reportCommentAbuse(
        postId,
        documentId,
        commentId,
        validReason,
        `User reported: ${reason}`,
      )

      if (!response.success && response.error) {
        throw new Error(response.error)
      }

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
    setImageFile(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] Image upload triggered in feed comment section")
    const file = e.target.files?.[0]
    if (file) {
      console.log("[v0] File selected:", { name: file.name, size: file.size, type: file.type })

      if (!file.type.startsWith("image/")) {
        console.log("[v0] Invalid file type:", file.type)
        alert("Please select an image file")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        console.log("[v0] File too large:", file.size)
        alert("Image must be smaller than 5MB")
        return
      }

      setImageFile(file)
      console.log("[v0] Image file set successfully")
    }
  }

  const removeImage = () => {
    console.log("[v0] Removing selected image")
    setImageFile(null)
    const fileInput = document.getElementById("feed-comment-image-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const canViewComments = isAuthenticated || allowViewingForAll

  const renderCommentWithReplies = (comment: Comment, level = 0) => {
    const isAuthor =
      user &&
      comment.author &&
      (String(user.id) === String(comment.author.id) ||
        user.username === comment.author.name ||
        user.email === comment.author.email ||
        user.name === comment.author.name)

    const formattedDate = formatDate(comment.createdAt)

    const isSubmittingThis = submittingCommentId === comment.documentId

    console.log("[v0] Rendering comment:", {
      commentId: comment.id,
      authorId: comment.author?.id,
      authorName: comment.author?.name,
      currentUserId: user?.id,
      currentUserName: user?.username || user?.name,
      isAuthor,
    })

    return (
      <div key={comment.id} className={`mt-4 ${level > 0 ? "ml-6 border-l-2 border-gray-100 pl-4" : ""}`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage
              src={comment.author.avatar || ""}
              alt={comment.author.name}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
            <AvatarFallback className="bg-pink-100 text-pink-800">
              {getNameInitials(comment.author.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className={`bg-gray-50 rounded-lg p-3 ${isSubmittingThis ? "opacity-70" : ""}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{comment.author.name}</p>
                  {isSubmittingThis && (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-pink-500" />
                      <span className="text-xs text-pink-500">Posting...</span>
                    </div>
                  )}
                </div>
                {isAuthor && !isSubmittingThis && (
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
              {comment.attachment && (
                <div className="mt-2">
                  <img
                    src={comment.attachment.url || "/placeholder.svg"}
                    alt="Comment attachment"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center mt-1 text-xs text-gray-500">
              <span>{formattedDate}</span>
              {!isSubmittingThis && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

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
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
            <AvatarFallback className="bg-pink-100 text-pink-800 text-lg">
              {getNameInitials(user?.username || user?.name || "U")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 relative">
            <div className="relative border border-gray-200 rounded-full focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500">
              <Textarea
                ref={commentInputRef}
                placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Write a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting || !isAuthenticated}
                className="resize-none border-0 focus:ring-0 focus:border-0 bg-transparent rounded-full pr-20 min-h-[50px] py-3"
                rows={1}
                aria-label="Comment input"
                aria-invalid={!!error}
                aria-describedby={error ? "comment-error" : "comment-help"}
              />

              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  id="feed-comment-image-upload"
                  disabled={isSubmitting}
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor="feed-comment-image-upload"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer transition-colors"
                  aria-label="Add image to comment"
                >
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                </label>
              </div>

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

            {imageFile && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(imageFile) || "/placeholder.svg"}
                      alt="Selected image preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{imageFile.name}</p>
                    <p className="text-xs text-gray-500">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-xs text-green-600 mt-1">✓ Image ready to upload</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  id="feed-comment-image-upload"
                  disabled={isSubmitting}
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor="feed-comment-image-upload"
                  className={`inline-flex items-center justify-center h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer transition-colors ${
                    imageFile ? "bg-pink-100 hover:bg-pink-200 text-pink-600" : "hover:bg-gray-100 text-gray-500"
                  }`}
                  aria-label={imageFile ? "Change image" : "Add image to comment"}
                >
                  <ImageIcon className="h-4 w-4" />
                </label>
              </div>
            </div>
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
