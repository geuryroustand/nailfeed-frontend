"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { TryOnButton } from "@/components/try-on/try-on-button"
import { MediaGallery } from "@/components/media-gallery"
import { CommentSection } from "@/components/comments/comment-section"
import { RelatedPosts } from "@/components/related-posts"
import type { Post } from "@/types/post"

interface PostDetailViewProps {
  post: Post
  relatedPosts?: Post[]
}

export function PostDetailView({ post, relatedPosts = [] }: PostDetailViewProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes || 0)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title || "Check out this nail art!",
        text: post.description || "I found this amazing nail art design!",
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const timeAgo = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""

  // Get the first image URL for try-on feature
  const firstImageUrl = post.media && post.media.length > 0 ? post.media[0].url : undefined

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8 overflow-hidden">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatarUrl || "/placeholder.svg"} alt={post.author?.name || "User"} />
              <AvatarFallback>{post.author?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.author?.name || "Anonymous"}</p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>Share</DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Media */}
        {post.media && post.media.length > 0 && <MediaGallery media={post.media} alt={post.title || "Post image"} />}

        {/* Post Content */}
        <CardContent className="p-4">
          {post.title && <h1 className="text-2xl font-bold mb-2">{post.title}</h1>}
          {post.description && <p className="text-gray-700 mb-6">{post.description}</p>}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-6">
              {post.tags.map((tag) => (
                <span key={tag} className="text-sm text-blue-600">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post Stats */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span className="mr-4">{likeCount} likes</span>
            <span>{post.comments?.length || 0} comments</span>
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

              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" })}
                aria-label="Comment"
              >
                <MessageCircle className="h-5 w-5 mr-1" />
                Comment
              </Button>

              <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share">
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

      {/* Comments Section */}
      <div id="comments" className="mb-8">
        <CommentSection postId={post.id} initialComments={post.comments || []} />
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">You might also like</h2>
          <RelatedPosts posts={relatedPosts} />
        </div>
      )}
    </div>
  )
}
