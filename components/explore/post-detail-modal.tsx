"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Heart, MessageCircle, Bookmark, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ExplorePostWithLiked } from "@/lib/explore-data"
import { getPostComments } from "@/lib/explore-data"
import { Skeleton } from "@/components/ui/skeleton"

interface PostDetailModalProps {
  post: ExplorePostWithLiked
  onClose: () => void
  onLike: () => void
  onSave: () => void
  onAddComment: (comment: string) => Promise<any>
}

export default function PostDetailModal({ post, onClose, onLike, onSave, onAddComment }: PostDetailModalProps) {
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

  // Focus the comment input when the modal opens
  useEffect(() => {
    if (commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus()
      }, 100)
    }
  }, [])

  // Load comments when the modal opens
  useEffect(() => {
    async function loadComments() {
      setIsLoadingComments(true)
      setError(null)

      try {
        const fetchedComments = await getPostComments(post.id)
        setComments(fetchedComments)
      } catch (err) {
        console.error("Error loading comments:", err)
        setError("Failed to load comments. Please try again.")
      } finally {
        setIsLoadingComments(false)
      }
    }

    loadComments()
  }, [post.id])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await onAddComment(comment)
      if (result && result.comment) {
        setComments((prev) => [result.comment, ...prev])
        setComment("")
      }
    } catch (err) {
      console.error("Error submitting comment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[900px] p-0 h-[90vh] max-h-[700px] flex flex-col md:flex md:flex-row overflow-hidden">
        {/* Image Section */}
        <div className="w-full md:w-3/5 bg-black flex items-center justify-center">
          <img
            src={post.image || "/placeholder.svg"}
            alt={`Nail art by ${post.username}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Content Section */}
        <div className="w-full md:w-2/5 flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.userImage || "/placeholder.svg"} alt={post.username} />
                <AvatarFallback>{post.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{post.username}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Comments */}
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {/* Post description */}
              <div className="flex space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.userImage || "/placeholder.svg"} alt={post.username} />
                  <AvatarFallback>{post.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{post.username}</p>
                  <p className="text-sm">{post.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs text-blue-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Comments */}
              {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

              {isLoadingComments ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment, i) => (
                      <div key={i} className="flex space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.userImage || "/placeholder.svg"} alt={comment.username} />
                          <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{comment.username}</p>
                          <p className="text-sm">{comment.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-4 border-t border-b">
            <div className="flex justify-between">
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" onClick={onLike}>
                  <Heart className={`h-6 w-6 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => commentInputRef.current?.focus()}>
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={onSave}>
                <Bookmark className={`h-6 w-6 ${post.isSaved ? "fill-black" : ""}`} />
              </Button>
            </div>
            <div className="mt-2">
              <p className="text-sm font-semibold">{post.likes}</p>
              <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Comment Input */}
          <form onSubmit={handleSubmitComment} className="p-4 flex items-center space-x-2">
            <Input
              ref={commentInputRef}
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={!comment.trim() || isSubmitting}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
