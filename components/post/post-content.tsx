import Link from "next/link"
import type { Post } from "@/lib/post-data"

interface PostContentProps {
  post: Post
}

// Helper function to format post description with hashtags
function formatDescriptionWithHashtags(description: string) {
  if (!description) return null

  const parts = description.split(/(#\w+)/g)
  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <Link
          href={`/explore?tag=${part.substring(1)}`}
          key={index}
          className="text-pink-500 font-medium hover:underline"
        >
          {part}
        </Link>
      )
    }
    return part
  })
}

export default function PostContent({ post }: PostContentProps) {
  return (
    <div className="p-4 sm:p-6">
      {/* Description */}
      {post.description && (
        <div className="mb-4">
          <p className="text-base sm:text-lg leading-relaxed">{formatDescriptionWithHashtags(post.description)}</p>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <Link
              key={index}
              href={`/tag/${tag}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
