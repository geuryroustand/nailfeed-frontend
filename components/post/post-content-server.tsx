"use client"

import { formatDate, formatBackendDate } from "@/lib/date-utils"
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import Link from "next/link"
import type { Post as PostType } from "@/lib/post-data"

interface PostContentServerProps {
  post: PostType
}

export default function PostContentServer({ post }: PostContentServerProps) {
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
            onClick={(e) => e.stopPropagation()} // Prevent triggering parent link
          >
            {part}
          </Link>
        )
      }
      return part
    })
  }

  // Get the profile URL for the post author
  const getProfileUrl = () => {
    // Use username for profile links
    return `/profile/${post.username}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Link href={getProfileUrl()} className="flex items-center group">
          <EnhancedAvatar
            src={post.userImage}
            alt={post.username}
            className="h-10 w-10"
            fallbackClassName="bg-pink-100 text-pink-800"
          />
          <div className="ml-3">
            {/* Post author username and timestamp */}
            <div className="flex items-center">
              <p className="text-sm font-medium group-hover:text-pink-500 transition-colors">{post.username}</p>
            </div>
            <p className="text-xs text-gray-500">
              {post.createdAt ? formatBackendDate(post.createdAt) : formatDate(post.timestamp)}
            </p>
          </div>
        </Link>
      </div>

      {/* Post title - only display if it exists */}
      {post.title && (
        <div className="mb-2">
          <h2 className="text-lg font-bold text-gray-900">{post.title}</h2>
        </div>
      )}

      {/* Post description */}
      <div className="mb-3">
        <p className="text-sm">{formatDescriptionWithHashtags()}</p>
      </div>
    </div>
  )
}
