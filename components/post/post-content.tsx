"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { TryOnButton } from "@/components/try-on/try-on-button"
import { MediaGallery } from "@/components/media-gallery"
import type { Post } from "@/types/post"

interface PostContentProps {
  post: Post
  onLike?: () => void
  onComment?: () => void
  onSave?: () => void
  onShare?: () => void
}

export function PostContent({ post, onLike, onComment, onSave, onShare }: PostContentProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes || 0)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
    if (onLike) onLike()
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    if (onSave) onSave()
  }

  const timeAgo = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""

  // Get the first image URL for try-on feature
  const firstImageUrl = post.media && post.media.length > 0 ? post.media[0].url : undefined

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center space-x-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.author?.avatarUrl || "/placeholder.svg"} alt={post.author?.name || "User"} />
          <AvatarFallback>{post.author?.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{post.author?.name || "Anonymous"}</p>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </div>
      </div>

      {/* Post Media */}
      {post.media && post.media.length > 0 && <MediaGallery media={post.media} alt={post.title || "Post image"} />}

      {/* Post Content */}
      <CardContent className="p-4">
        {post.title && <h3 className="font-bold mb-2">{post.title}</h3>}
        {post.description && <p className="text-gray-700 mb-4">{post.description}</p>}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-blue-600">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="mr-4">{likeCount} likes</span>
          <span>{post.comments || 0} comments</span>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={isLiked ? "text-pink-500" : ""}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <Heart className={`h-5 w-5 mr-1 ${isLiked ? "fill-current" : ""}`} />
              Like
            </Button>

            <Button variant="ghost" size="sm" onClick={onComment} aria-label="Comment">
              <MessageCircle className="h-5 w-5 mr-1" />
              Comment
            </Button>

            <Button variant="ghost" size="sm" onClick={onShare} aria-label="Share">
              <Share2 className="h-5 w-5 mr-1" />
              Share
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {firstImageUrl && (
              <TryOnButton
                designImageUrl={firstImageUrl}
                designTitle={post.title || "Nail Design"}
                variant="outline"
                size="sm"
              />
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className={isSaved ? "text-yellow-500" : ""}
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              <Bookmark className={`h-5 w-5 mr-1 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
