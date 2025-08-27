"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, X } from "lucide-react"
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import { formatDate, formatBackendDate } from "@/lib/date-utils"
import Link from "next/link"
import type { BackgroundType } from "./post-background-selector"

interface TextPostModalProps {
  isOpen: boolean
  onClose: () => void
  post: {
    id: number
    documentId: string
    username: string
    userImage: string
    title?: string
    description: string
    contentType?: string
    background?: BackgroundType
    likesCount: number
    commentsCount: number
    timestamp?: string
    createdAt?: string
    publishedAt?: string
  }
}

export function TextPostModal({ isOpen, onClose, post }: TextPostModalProps) {
  // Format post description to highlight hashtags
  const formatDescriptionWithHashtags = () => {
    if (!post.description) return null

    const parts = post.description.split(/(#\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <Link
            href={`/explore?tag=${part.substring(1)}`}
            key={index}
            className="text-pink-500 font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        )
      }
      return part
    })
  }

  const getTextColorForBackground = () => {
    if (!post.background) return "text-gray-900"

    if (post.background.type === "color" || post.background.type === "gradient") {
      return "text-white"
    }

    return "text-gray-900"
  }

  const getPostUrl = () => {
    const postIdentifier = post.documentId || post.id
    return `/post/${postIdentifier}`
  }

  const getProfileUrl = () => {
    return `/profile/${post.username}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={getProfileUrl()} className="flex items-center group">
                <EnhancedAvatar
                  src={post.userImage}
                  alt={post.username}
                  className="h-10 w-10"
                  fallbackClassName="bg-pink-100 text-pink-800"
                />
                <div className="ml-3">
                  <DialogTitle className="text-base font-medium group-hover:text-pink-500 transition-colors">
                    {post.username}
                  </DialogTitle>
                  <p className="text-xs text-gray-500">
                    {post.createdAt
                      ? formatBackendDate(post.createdAt)
                      : post.publishedAt
                        ? formatBackendDate(post.publishedAt)
                        : formatDate(post.timestamp || new Date().toISOString())}
                  </p>
                </div>
              </Link>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Post title - only display if it exists */}
          {post.title && (
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
            </div>
          )}

          {/* Text content with background */}
          {post.contentType === "text-background" && post.background ? (
            <div className={`rounded-lg p-8 mb-6 ${post.background.value} ${post.background.animation || ""}`}>
              <div className={`text-xl font-semibold text-center ${getTextColorForBackground()}`}>
                {formatDescriptionWithHashtags()}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="text-base leading-relaxed whitespace-pre-wrap">{formatDescriptionWithHashtags()}</div>
            </div>
          )}

          {/* Engagement stats */}
          <div className="flex items-center justify-between py-3 border-t border-b">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                <span>{post.likesCount || 0} likes</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{post.commentsCount || 0} comments</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-4 pt-4">
            <Link href={getPostUrl()}>
              <Button variant="default" className="flex-1">
                View Full Post
              </Button>
            </Link>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
