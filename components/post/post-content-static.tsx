import Link from "next/link"
import type { Post } from "@/lib/post-data"
import { formatDate, formatBackendDate } from "@/lib/date-utils"

interface PostContentStaticProps {
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

export default function PostContentStatic({ post }: PostContentStaticProps) {
  // Format the timestamp - check for both createdAt (backend format) and timestamp
  const formattedDate = post.createdAt ? formatBackendDate(post.createdAt) : formatDate(post.timestamp)

  return (
    <div className="p-4 sm:p-6">
      {/* Post title */}
      {post.title && <h1 className="text-xl font-semibold mb-2">{post.title}</h1>}

      {/* Post description */}
      {post.description && <div className="text-gray-700 mb-4">{formatDescriptionWithHashtags(post.description)}</div>}

      {/* Post metadata */}
      <div className="text-sm text-gray-500 mb-4">
        <span>Posted {formattedDate}</span>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
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
    </div>
  )
}
