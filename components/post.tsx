"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageCircle, MoreHorizontal, CornerDownRight, X, Smile, Send, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { BackgroundType } from "./post-background-selector"
import type { MediaItem, MediaGalleryLayout } from "@/types/media"
import MediaGallery from "./media-gallery"
import { ShareMenu } from "./share-menu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { focusWithoutScroll } from "@/lib/focus-utils"
import { Input } from "@/components/ui/input"
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import { ReactionButton } from "./reaction-button"

interface PostProps {
  post: {
    id: number
    documentId?: string
    username: string
    userImage: string
    image?: string
    video?: string
    mediaItems?: MediaItem[]
    galleryLayout?: MediaGalleryLayout
    description: string
    likes: number
    comments: any[]
    timestamp: string
    contentType?: "image" | "video" | "text-background" | "media-gallery"
    background?: BackgroundType
  }
  viewMode?: "cards" | "compact"
  onPostDeleted?: (postId: number) => void
  onPostUpdated?: (updatedPost: any) => void
}

type Reaction = "like" | "love" | "haha" | "wow" | "sad" | "angry" | null

// Enhanced CommentItemProps interface
interface CommentItemProps {
  comment: any
  postId: number
  onReply: (commentId: number, username: string) => void
  onReaction: (commentId: number, reactionType: string) => void
  depth?: number
  isLastReply?: boolean
}

// Refactored CommentItem component with improved visual design
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onReply,
  onReaction,
  depth = 0,
  isLastReply = false,
}) => {
  const [showReactions, setShowReactions] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const reactionsRef = useRef<HTMLDivElement>(null)
  const reactionButtonRef = useRef<HTMLButtonElement>(null)
  const hasReplies = comment.replies && comment.replies.length > 0
  const maxDepth = 3 // Maximum nesting level before we stop indenting

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
    <div className={cn("flex flex-col", depth > 0 && "mt-3")}>
      <div className="flex items-start">
        {/* Indentation lines for nested comments */}
        {depth > 0 && (
          <div className="mr-2 pt-4 self-stretch flex items-start">
            <div className={cn("w-6 border-l-2 border-gray-200 h-full", isLastReply && "h-4")} />
          </div>
        )}

        <div className={cn("flex-1", depth > 0 && "pl-0")}>
          <div className="flex items-start">
            <Avatar className="h-8 w-8 mr-2 shrink-0">
              <AvatarImage src={comment.userImage || "/placeholder.svg"} alt={comment.username} />
              <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-3">
                {comment.replyToUsername && (
                  <p className="text-xs text-gray-500 mb-1">
                    Replying to <span className="font-medium text-pink-500">@{comment.replyToUsername}</span>
                  </p>
                )}
                <p className="text-sm font-medium">{comment.username}</p>
                <p className="text-sm">{comment.text}</p>
              </div>

              {/* Comment actions and reactions */}
              <div className="mt-1 flex flex-wrap items-center gap-2">
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

                {/* Reaction button - using the same approach as post reactions */}
                <div className="relative">
                  <button
                    ref={reactionButtonRef}
                    className={`flex items-center h-6 px-2 text-xs rounded-md hover:bg-gray-100 transition-colors ${
                      userReaction ? "text-pink-500" : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => onReaction(comment.id, userReaction ? userReaction : "👍")}
                    onMouseEnter={() => setShowReactions(true)}
                  >
                    {userReaction ? (
                      <span className="mr-1 text-sm">{userReaction}</span>
                    ) : (
                      <Smile className="h-3.5 w-3.5 mr-1" />
                    )}
                    <span className="text-xs font-medium">React</span>
                  </button>

                  {/* Reactions panel - using AnimatePresence like post reactions */}
                  <AnimatePresence>
                    {showReactions && (
                      <motion.div
                        ref={reactionsRef}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg p-1 flex z-50"
                        onMouseLeave={() => setShowReactions(false)}
                      >
                        {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
                          <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 mx-1 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              onReaction(comment.id, emoji)
                              setShowReactions(false)
                            }}
                          >
                            <span className="text-lg" role="img" aria-label={emoji}>
                              {emoji}
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reply button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => onReply(comment.id, comment.username)}
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
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 ml-1"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    )}
                    {isExpanded ? "Hide replies" : `Show replies (${comment.replies.length})`}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Nested replies */}
          {hasReplies && isExpanded && (
            <div className={cn("pl-10")}>
              {comment.replies.map((reply: any, index: number) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReply={onReply}
                  onReaction={onReaction}
                  depth={Math.min(depth + 1, maxDepth)}
                  isLastReply={index === comment.replies.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Post({ post, viewMode = "cards", onPostDeleted, onPostUpdated }: PostProps) {
  const [reaction, setReaction] = useState<Reaction>(null)
  const [showReactions, setShowReactions] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [commentOpen, setCommentOpen] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState(post.comments || [])
  const reactionsRef = useRef<HTMLDivElement>(null)
  const likeButtonRef = useRef<HTMLButtonElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const commentSectionRef = useRef<HTMLDivElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null)

  const handleLikeClick = () => {
    setReaction((prevReaction) => {
      const newReaction = prevReaction === "like" ? null : "like"
      if (newReaction === null) {
        setLikeCount(likeCount - 1)
      } else if (prevReaction === null) {
        setLikeCount(likeCount + 1)
      }
      return newReaction
    })
  }

  const handleReaction = (reactionType: Reaction) => {
    setReaction((prevReaction) => {
      const newReaction = prevReaction === reactionType ? null : reactionType
      return newReaction
    })
  }

  const adjustTextareaHeight = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const handleCommentReaction = (commentId: number, reactionType: string) => {
    setComments((prevComments) => {
      // Helper function to recursively find and update the comment with the reaction
      const updateCommentReaction = (comments: any[]): any[] => {
        return comments.map((c) => {
          if (c.id === commentId) {
            const currentReactions = c.reactions || {}
            let currentUserReaction = null
            for (const [type, data] of Object.entries(currentReactions)) {
              if ((data as any).reacted) {
                currentUserReaction = type
                break
              }
            }

            const newReactions = { ...currentReactions }

            if (currentUserReaction && currentUserReaction !== reactionType) {
              newReactions[currentUserReaction] = {
                ...newReactions[currentUserReaction],
                count: Math.max(0, (newReactions[currentUserReaction].count || 1) - 1),
                reacted: false,
              }

              newReactions[reactionType] = {
                emoji: reactionType,
                count: (newReactions[reactionType]?.count || 0) + 1,
                reacted: true,
              }
            } else {
              const currentReaction = newReactions[reactionType] || { emoji: reactionType, count: 0, reacted: false }
              const newReacted = !currentReaction.reacted

              newReactions[reactionType] = {
                emoji: reactionType,
                count: Math.max(0, currentReaction.count + (newReacted ? 1 : -1)),
                reacted: newReacted,
              }
            }

            return { ...c, reactions: newReactions }
          } else if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateCommentReaction(c.replies) }
          }
          return c
        })
      }

      return updateCommentReaction(prevComments)
    })
  }

  const handleReplyToComment = (commentId: number, username: string) => {
    setReplyTo({ id: commentId, username })
    setCommentOpen(true) // Ensure comment section is open
    if (commentInputRef.current) {
      commentInputRef.current.focus() // Focus the input
    }
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (newComment.trim()) {
      const newCommentObj = {
        id: Date.now(),
        username: "you",
        text: newComment,
        timestamp: "Just now",
        reactions: {
          "👍": { emoji: "👍", count: 0, reacted: false },
          "❤️": { emoji: "❤️", count: 0, reacted: false },
          "😂": { emoji: "😂", count: 0, reacted: false },
          "😮": { emoji: "😮", count: 0, reacted: false },
          "😢": { emoji: "😢", count: 0, reacted: false },
          "😡": { emoji: "😡", count: 0, reacted: false },
        },
        replies: [],
      }

      if (replyTo) {
        // This is a reply to an existing comment
        newCommentObj.parentId = replyTo.id
        newCommentObj.replyToUsername = replyTo.username

        // Add the reply to the correct parent comment
        setComments((prevComments) => {
          // Helper function to recursively find and update the parent comment
          const addReplyToComment = (comments: any[]): any[] => {
            return comments.map((c) => {
              if (c.id === replyTo.id) {
                // Found the parent comment, add the reply
                return {
                  ...c,
                  replies: [...(c.replies || []), newCommentObj],
                }
              } else if (c.replies && c.replies.length > 0) {
                // Check if the parent is in the replies
                return {
                  ...c,
                  replies: addReplyToComment(c.replies),
                }
              }
              return c
            })
          }

          return addReplyToComment(prevComments)
        })

        // Clear the reply state
        setReplyTo(null)
      } else {
        // This is a top-level comment
        setComments((prevComments) => [...prevComments, newCommentObj])
      }

      // Update state
      setNewComment("")

      // Focus back on the input after submitting without scrolling the page
      if (commentInputRef.current) {
        // Use the focusWithoutScroll utility instead of direct focus
        focusWithoutScroll(commentInputRef.current)
      }
    }
  }

  const getReactionEmoji = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "👍"
      case "love":
        return "❤️"
      case "haha":
        return "😂"
      case "wow":
        return "😮"
      case "sad":
        return "😢"
      case "angry":
        return "😡"
      default:
        return null
    }
  }

  const getReactionColor = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "text-blue-500"
      case "love":
        return "text-red-500"
      case "haha":
        return "text-yellow-500"
      case "wow":
        return "text-yellow-500"
      case "sad":
        return "text-yellow-500"
      case "angry":
        return "text-orange-500"
      default:
        return "text-gray-500"
    }
  }

  const getReactionText = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "Like"
      case "love":
        return "Love"
      case "haha":
        return "Haha"
      case "wow":
        return "Wow"
      case "sad":
        return "Sad"
      case "angry":
        return "Angry"
      default:
        return "Like"
    }
  }

  const getTextColorForBackground = () => {
    if (!post.background) return "text-black"

    if (post.background.type === "color" || post.background.type === "gradient") {
      return "text-white"
    }

    return "text-black"
  }

  // Convert legacy single media to mediaItems format or use existing mediaItems
  const getMediaItems = (): MediaItem[] => {
    // If we have mediaItems array with items, use it
    if (post.mediaItems && post.mediaItems.length > 0) {
      return post.mediaItems.map((item) => ({
        id: item.id || `media-${Math.random()}`,
        type: item.type || "image",
        url: item.url,
        file: item.file,
      }))
    }

    // Legacy fallbacks
    if (post.contentType === "image" && post.image) {
      return [
        {
          id: "legacy-image",
          type: "image",
          url: post.image,
        },
      ]
    }

    if (post.contentType === "video" && post.video) {
      return [
        {
          id: "legacy-video",
          type: "video",
          url: post.video,
        },
      ]
    }

    // If we have an image but no contentType specified
    if (post.image) {
      return [
        {
          id: "legacy-image",
          type: "image",
          url: post.image,
        },
      ]
    }

    return []
  }

  // Generate the post URL - prefer documentId if available
  const getPostUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
    // Use documentId if available, otherwise fall back to id
    const postIdentifier = post.documentId || post.id
    return `${baseUrl}/post/${postIdentifier}`
  }

  // Handle share success
  const handleShareSuccess = () => {
    toast({
      title: "Post shared!",
      description: "Thanks for sharing this post.",
      duration: 2000,
    })
  }

  useEffect(() => {
    if (!commentOpen) {
      setReplyTo(null)
    }
  }, [commentOpen])

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <EnhancedAvatar
              src={post.userImage}
              alt={post.username}
              className="h-10 w-10"
              fallback={post.username.substring(0, 2).toUpperCase()}
            />
            <div className="ml-3">
              <p className="text-sm font-medium">{post.username}</p>
              <p className="text-xs text-gray-500">{post.timestamp}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save post</DropdownMenuItem>
              <DropdownMenuItem>Hide post</DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Make the description clickable for text-only posts - use documentId if available */}
        <Link href={`/post/${post.documentId || post.id}`} className="block mb-3">
          <p className="text-sm">{post.description}</p>
        </Link>

        {post.contentType === "text-background" && post.background ? (
          <Link href={`/post/${post.documentId || post.id}`} className="block">
            <div className={`rounded-lg p-6 mb-3 ${post.background.value} ${post.background.animation || ""}`}>
              <p className={`text-xl font-semibold text-center ${getTextColorForBackground()}`}>{post.description}</p>
            </div>
          </Link>
        ) : null}

        {(post.contentType === "image" ||
          post.contentType === "video" ||
          post.contentType === "media-gallery" ||
          getMediaItems().length > 0) && (
          <div className="mb-3 w-full">
            <Link href={`/post/${post.documentId || post.id}`} className="block w-full">
              <MediaGallery
                items={getMediaItems()}
                layout={post.galleryLayout || (getMediaItems().length > 1 ? "grid" : "featured")}
                maxHeight={500}
              />
            </Link>
          </div>
        )}

        {/* Likes and comments count */}
        <div className="flex items-center justify-between mt-3 pb-3 border-b">
          <div className="flex items-center">
            {reaction && <span className="mr-1 text-sm">{getReactionEmoji(reaction)}</span>}
            <span className="text-sm text-gray-500">{likeCount > 0 ? `${likeCount}` : ""}</span>
          </div>
          <div className="text-sm text-gray-500">{comments.length > 0 && `${comments.length} comments`}</div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between py-1 relative">
          <ReactionButton
            postId={post.id}
            onReactionChange={(type) => {
              // This is called when the reaction changes
              console.log(`Reaction changed to: ${type}`)
            }}
          />

          <button
            className="flex items-center justify-center flex-1 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            onClick={() => setCommentOpen(!commentOpen)}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Comment</span>
          </button>

          <ShareMenu
            url={getPostUrl()}
            title={post.description}
            description={`Check out this post by ${post.username}`}
            image={post.image || (post.mediaItems && post.mediaItems[0]?.url)}
            variant="ghost"
            className="flex-1 justify-center py-2 h-auto rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            onShare={handleShareSuccess}
          />
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {commentOpen && (
            <motion.div
              ref={commentSectionRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
              transition={{ duration: 0.2 }}
            >
              {/* Comments list with improved styling */}
              <div
                className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {replyTo && (
                  <div className="flex items-center bg-gray-50 rounded-lg p-2 mb-2">
                    <p className="text-xs flex-1">
                      Replying to <span className="font-medium text-pink-500">@{replyTo.username}</span>
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="h-6 w-6 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      postId={post.id}
                      onReply={handleReplyToComment}
                      onReaction={handleCommentReaction}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Enhanced comment form */}
              <form onSubmit={handleCommentSubmit} className="flex items-start sticky bottom-0 bg-white pt-2 border-t">
                <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                  <AvatarFallback>YO</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative flex items-center">
                  <Input
                    placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Write a comment..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-gray-50 rounded-full px-4 py-2 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none overflow-hidden"
                    style={{ minHeight: "40px", maxHeight: "120px" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        if (newComment.trim()) {
                          handleCommentSubmit(e)
                        }
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={!newComment.trim()}
                    className="absolute right-2 text-pink-500 disabled:text-gray-300 hover:bg-transparent"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
