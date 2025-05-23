import { Suspense } from "react"
import StructuredData from "./post/structured-data"
import type { Post } from "@/lib/post-data"
import PostDetailSkeleton from "./post-detail-skeleton"
import PostDetailClientWrapper from "./post-detail-client-wrapper"
import PostContentStatic from "./post/post-content-static"
import { trackPostView } from "@/lib/actions/post-detail-actions"
import EnhancedMediaGallery from "@/components/enhanced-media-gallery"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { formatDate, formatBackendDate } from "@/lib/date-utils"

interface PostDetailServerOptimizedProps {
  post: Post
  relatedPosts?: Post[]
}

export default function PostDetailServerOptimized({ post, relatedPosts = [] }: PostDetailServerOptimizedProps) {
  // Generate the post URL for structured data
  const postUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/post/${post.documentId || post.id}`

  // Ensure the post has a documentId for comment functionality
  const postWithDocumentId = {
    ...post,
    documentId: post.documentId || `post-${post.id}`,
  }

  // Track post view (non-blocking)
  trackPostView(post.id).catch(console.error)

  // Format the timestamp
  const formattedDate = post.createdAt ? formatBackendDate(post.createdAt) : formatDate(post.timestamp)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Add structured data for SEO */}
      <StructuredData post={post} url={postUrl} />

      {/* Post header - server rendered */}
      <div className="p-4 sm:p-6 border-b bg-white rounded-t-xl shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href={`/profile/${post.username}`} aria-label={`View ${post.username}'s profile`}>
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 transition-transform hover:scale-105">
                <AvatarImage
                  src={post.userImage || "/abstract-user-icon.png"}
                  alt={post.username || "User"}
                  width={56}
                  height={56}
                  loading="eager"
                  priority={true}
                />
                <AvatarFallback>{post.username?.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="ml-3">
              <Link
                href={`/profile/${post.username}`}
                className="text-base sm:text-lg font-medium hover:text-pink-600 transition-colors"
              >
                {post.username || "Unknown User"}
              </Link>
              <p className="text-sm text-gray-500">{formattedDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main post content - server rendered */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Post media gallery - server rendered */}
        {post.mediaItems && post.mediaItems.length > 0 && (
          <div className="mb-4">
            <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse"></div>}>
              <EnhancedMediaGallery mediaItems={post.mediaItems} layout={post.galleryLayout || "grid"} />
            </Suspense>
          </div>
        )}

        {/* Static post content - server rendered */}
        <PostContentStatic post={postWithDocumentId} />

        {/* Interactive elements - client rendered */}
        <Suspense fallback={<PostDetailSkeleton />}>
          <PostDetailClientWrapper post={postWithDocumentId} relatedPosts={relatedPosts} />
        </Suspense>
      </div>
    </div>
  )
}
