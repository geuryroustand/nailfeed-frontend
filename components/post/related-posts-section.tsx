import Image from "next/image"
import Link from "next/link"
import type { Post } from "@/lib/post-data"

interface RelatedPostsSectionProps {
  posts: Post[]
  className?: string
}

export default function RelatedPostsSection({ posts, className = "" }: RelatedPostsSectionProps) {
  if (posts.length === 0) return null

  return (
    <div className={`mt-12 ${className}`}>
      <h2 className="text-2xl font-bold mb-4">Related Posts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {posts.map((relatedPost) => (
          <Link
            key={relatedPost.id}
            href={`/post/${relatedPost.documentId || relatedPost.id}`}
            className="block overflow-hidden rounded-lg transition-transform hover:scale-105"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={relatedPost.image || "/intricate-nail-art.png"}
                alt={relatedPost.description || "Nail art"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="p-2">
              <p className="text-sm font-medium truncate">{relatedPost.description}</p>
              <p className="text-xs text-gray-500">@{relatedPost.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
