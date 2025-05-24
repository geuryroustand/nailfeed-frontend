import Link from "next/link"
import { EnhancedMediaGallery } from "@/components/enhanced-media-gallery"
import type { Post } from "@/lib/post-data"

interface PostDetailContentProps {
  post: Post
}

export default function PostDetailContent({ post }: PostDetailContentProps) {
  return (
    <>
      {/* Post media gallery */}
      {post.mediaItems && post.mediaItems.length > 0 && (
        <div className="mb-4">
          <EnhancedMediaGallery mediaItems={post.mediaItems} layout={post.galleryLayout || "grid"} />
        </div>
      )}

      {/* Post content */}
      <div className="p-4 sm:p-6">
        {post.title && <h1 className="text-xl font-semibold mb-2">{post.title}</h1>}

        {post.description && (
          <div className="text-gray-700 mb-4">
            {post.tags && post.tags.length > 0
              ? post.description.split(" ").map((word, i) => {
                  const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, "")
                  const isTag = post.tags?.some((tag) => tag.toLowerCase() === cleanWord)
                  return (
                    <span key={i}>
                      {isTag ? (
                        <Link
                          href={`/explore?tag=${cleanWord}`}
                          className="text-pink-600 hover:underline decoration-1 underline-offset-2 transition-all duration-200"
                        >
                          {word}
                        </Link>
                      ) : (
                        <span className="hover:underline decoration-1 underline-offset-2 cursor-default transition-all duration-200">
                          {word}
                        </span>
                      )}{" "}
                    </span>
                  )
                })
              : post.description.split(" ").map((word, i) => (
                  <span
                    key={i}
                    className="hover:underline decoration-1 underline-offset-2 cursor-default transition-all duration-200"
                  >
                    {word}{" "}
                  </span>
                ))}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <Link
                key={index}
                href={`/explore?tag=${tag}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
