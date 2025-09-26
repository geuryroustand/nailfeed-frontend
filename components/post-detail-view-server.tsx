import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import type { Post } from "@/lib/post-data"
import { EnhancedMediaGallery } from "./enhanced-media-gallery"
import PostDetailClientWrapper from "./post-detail-client-wrapper"
import CommentSection from "@/components/comments/comment-section"
import RelatedPostsSection from "./related-posts-section"
import type { MediaItem } from "@/types/media"

interface PostDetailViewProps {
  post: Post
  relatedPosts?: Post[]
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

// Helper function to convert legacy media to MediaItem format
function getMediaItems(post: Post): MediaItem[] {
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

// Helper function to determine gallery layout
function getGalleryLayout(post: Post, mediaItems: MediaItem[]): string {
  // Use the galleryLayout from the post if available
  if (post.galleryLayout) {
    return post.galleryLayout
  }

  // Default to grid for multiple items, or featured for single item
  if (mediaItems.length <= 1) {
    return "featured"
  }

  return "grid"
}

export default function PostDetailView({ post, relatedPosts = [] }: PostDetailViewProps) {
  const mediaItems = getMediaItems(post)
  const galleryLayout = getGalleryLayout(post, mediaItems)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back navigation */}
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to feed</span>
        </Link>
      </div>

      {/* Main post card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Post header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <EnhancedAvatar
                src={post.userImage}
                alt={post.username}
                fallbackText={post.username}
                size="lg"
                className="h-12 w-12 sm:h-14 sm:w-14"
              />
              <div className="ml-3">
                <p className="text-base sm:text-lg font-medium">{post.username}</p>
                <p className="text-sm text-gray-500">{post.timestamp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Post media */}
        {mediaItems.length > 0 && (
          <div className="border-b">
            <EnhancedMediaGallery
              items={mediaItems}
              aspectRatio="auto"
              className="max-h-[600px]"
              priority
              layout={galleryLayout}
              fullscreenEnabled={true}
            />
          </div>
        )}

        {/* Post content */}
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

          {/* Client-side interactive components */}
          <PostDetailClientWrapper post={post} />
        </div>
      </div>

      {/* Comments section */}
      <div id="comments-section">
        <Suspense fallback={<div className="animate-pulse h-40 bg-gray-100 rounded-lg"></div>}>
          <CommentSection postId={post.id} documentId={post.documentId} />
        </Suspense>
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && <RelatedPostsSection posts={relatedPosts} />}
    </div>
  )
}
