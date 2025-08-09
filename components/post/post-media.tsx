import { EnhancedMediaGallery } from "@/components/enhanced-media-gallery"
import type { Post } from "@/lib/post-data"
import type { MediaItem } from "@/types/media"

interface PostMediaProps {
  post: Post
}

// Helper function to convert legacy media to MediaItem format
function getMediaItems(post: Post): MediaItem[] {
  // If we have mediaItems array with items, use it
  if (post.mediaItems && post.mediaItems.length > 0) {
    return post.mediaItems
      .filter((item) => item && (item.url || (item.file && item.file.url)))
      .map((item) => ({
        id: item.id || `media-${Math.random()}`,
        type: item.type || "image",
        url: item.url || (item.file && item.file.url) || "",
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

export default function PostMedia({ post }: PostMediaProps) {
  const mediaItems = getMediaItems(post)
  const galleryLayout = getGalleryLayout(post, mediaItems)

  if (mediaItems.length === 0) {
    return (
      <div className="border-b py-4 flex items-center justify-center bg-gray-50 h-48">
        <p className="text-gray-400">No media available</p>
      </div>
    )
  }

  return (
    <div className="border-b">
      <EnhancedMediaGallery
        items={mediaItems}
        aspectRatio="auto"
        className="max-h-[600px]"
        priority
        layout={galleryLayout}
        fullscreenEnabled={true}
        objectFit="contain"
      />
    </div>
  )
}
