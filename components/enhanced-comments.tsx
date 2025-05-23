"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, CornerDownRight, X, Smile, Send, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { focusWithoutScroll } from "@/lib/focus-utils"
import { useToast } from "@/hooks/use-toast"

interface Comment {
  id: number | string
  username: string
  userImage?: string
  text: string
  timestamp: string
  reactions?: Record<string, any>
  replies?: Comment[]
  parentId?: number | string
  replyToUsername?: string
}

interface EnhancedCommentsProps {
  postId: number | string
  comments: Comment[]
  onAddComment?: (text: string, replyToId?: number | string) => Promise<void>
  onAddReaction?: (commentId: number | string, reactionType: string) => Promise<void>
  className?: string
}

export function EnhancedComments({ postId, comments, onAddComment, onAddReaction, className }: EnhancedCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: number | string; username: string } | null>(null)
  const [expandedComments, setExpandedComments] = useState<Set<number | string>>(new Set())
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Toggle comment expansion
  const toggleCommentExpansion = (commentId: number | string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  // Handle reply to comment
  const handleReplyToComment = (commentId: number | string, username: string) => {
    setReplyTo({ id: commentId, username })

    // Focus the input after a short delay to ensure UI has updated
    setTimeout(() => {
      if (commentInputRef.current) {
        focusWithoutScroll(commentInputRef.current)
      }
    }, 100)
  }

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)

      if (onAddComment) {
        await onAddComment(newComment, replyTo?.id)
      }

      // Clear input and reply state
      setNewComment("")
      setReplyTo(null)

      // Scroll to bottom of comments
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Error",
        description: "Failed to submit your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle reaction to comment
  const handleCommentReaction = async (commentId: number | string, reactionType: string) => {
    try {
      if (onAddReaction) {
        await onAddReaction(commentId, reactionType)
      }
    } catch (error) {
      console.error("Error adding reaction:", error)
      toast({
        title: "Error",
        description: "Failed to add your reaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Render a single comment with its replies
  const renderComment = (comment: Comment, depth = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedComments.has(comment.id)
    const maxDepth = 3 // Maximum nesting level

    // Get user's reaction if any
    const getUserReaction = () => {
      if (!comment.reactions) return null

      for (const [type, data] of Object.entries(comment.reactions)) {
        if ((data as any).reacted) return type
      }
      return null
    }

    const userReaction = getUserReaction()

    // Calculate total reactions
    const getTotalReactions = () => {
      if (!comment.reactions) return 0

      return Object.values(comment.reactions).reduce((total, data) => total + (data as any).count, 0)
    }

    return (
      <div key={comment.id} className={cn("group", depth > 0 && "mt-3")}>
        <div className="flex items-start">
          {/* Indentation lines for nested comments */}
          {depth > 0 && (
            <div className="mr-2 pt-4 self-stretch flex items-start">
              <div className={cn("w-6 border-l-2 border-gray-200 h-full")} />
            </div>
          )}

          <div className={cn("flex-1", depth > 0 && "pl-0")}>
            <div className="flex items-start">
              <Avatar className="h-9 w-9 mr-2 shrink-0">
                <AvatarImage src={comment.userImage || "/placeholder.svg"} alt={comment.username} />
                <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3 group-hover:bg-gray-100 transition-colors">
                  {comment.replyToUsername && (
                    <p className="text-xs text-gray-500 mb-1">
                      Replying to <span className="font-medium text-pink-500">@{comment.replyToUsername}</span>
                    </p>
                  )}
                  <p className="text-sm font-medium">{comment.username}</p>
                  <p className="text-sm mt-1">{comment.text}</p>
                </div>

                {/* Comment actions and reactions */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {/* Reaction display */}
                  {Object.values(comment.reactions || {}).length > 0 && (
                    <div className="flex items-center bg-gray-100 rounded-full px-2 py-0.5 text-xs">
                      <div className="flex -space-x-1 mr-1">
                        {Object.values(comment.reactions || {}).map((reaction: any) =>
                          reaction.count > 0 ? (
                            <span key={reaction.emoji} className="text-sm" title={reaction.emoji}>
                              {reaction.emoji}
                            </span>
                          ) : null,
                        )}
                      </div>
                      <span className="text-gray-600">{getTotalReactions()}</span>
                    </div>
                  )}

                  {/* Reaction button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 px-2 text-xs rounded-md hover:bg-gray-100 transition-colors",
                      userReaction ? "text-pink-500" : "text-gray-500 hover:text-gray-700",
                    )}
                    onClick={() => handleCommentReaction(comment.id, userReaction || "👍")}
                  >
                    {userReaction ? (
                      <span className="mr-1 text-sm">{userReaction}</span>
                    ) : (
                      <Smile className="h-3.5 w-3.5 mr-1" />
                    )}
                    <span className="text-xs font-medium">React</span>
                  </Button>

                  {/* Reply button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => handleReplyToComment(comment.id, comment.username)}
                  >
                    <CornerDownRight className="h-3.5 w-3.5 mr-1" />
                    Reply
                  </Button>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-500 ml-auto">{comment.timestamp}</span>

                  {/* Expand/collapse button for comments with replies */}
                  {hasReplies && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => toggleCommentExpansion(comment.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                      )}
                      {isExpanded ? "Hide replies" : `Show replies (${comment.replies?.length})`}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Nested replies */}
            {hasReplies && isExpanded && (
              <div className={cn("pl-10 mt-3")}>
                {comment.replies?.map((reply) => renderComment(reply, Math.min(depth + 1, maxDepth)))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-white rounded-xl shadow-sm overflow-hidden", className)}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-gray-500" />
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      <div className="p-4">
        {/* Reply indicator */}
        {replyTo && (
          <div className="flex items-center bg-gray-50 rounded-lg p-2 mb-4">
            <p className="text-sm flex-1">
              Replying to <span className="font-medium text-pink-500">@{replyTo.username}</span>
            </p>
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Comment form */}
        <form onSubmit={handleCommentSubmit} className="flex items-start mb-6">
          <Avatar className="h-9 w-9 mr-3 mt-1 flex-shrink-0">
            <AvatarFallback>YO</AvatarFallback>
          </Avatar>

          <div className="flex-1 relative">
            <Textarea
              ref={commentInputRef}
              placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Write a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  if (newComment.trim()) {
                    handleCommentSubmit(e)
                  }
                }
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">Press Cmd+Enter to submit</p>
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post
              </Button>
            </div>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-5">
          {comments.length > 0 ? (
            comments.map((comment) => renderComment(comment))
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No comments yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>
    </div>
  )
}
