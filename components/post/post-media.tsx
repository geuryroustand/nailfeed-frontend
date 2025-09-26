import type { Post } from "@/lib/post-data"
import type { MediaItem } from "@/types/media"
import type { MediaFile } from "@/types/post"
import { OptimizedMediaImage } from "@/components/optimized-media-image"
import { cn } from "@/lib/utils"

interface PostMediaProps {
  post: Post
}

// Helper function to convert media to MediaItem format
function getMediaItems(post: Post): MediaItem[] {
  // Use media array (Strapi format) - from server response
  if (post.media && post.media.length > 0) {
    return post.media
      .filter((item) => item && item.url)
      .map((item) => ({
        id: item.id.toString(),
        type: item.mime?.startsWith("image/") ? "image" : "video",
        url: item.url,
        file: {
          formats: item.formats
        },
      })) as MediaItem[]
  }

  // Use mediaItems array (optimistic posts or legacy format)
  if (post.mediaItems && post.mediaItems.length > 0) {
    return post.mediaItems
      .filter((item) => item && item.url)
      .map((item) => ({
        id: item.id || `media-${Math.random()}`,
        type: item.type || "image",
        url: item.url || "",
        file: item.file,
      })) as MediaItem[]
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

// Render media gallery with Next.js Image components
function renderMediaGallery(mediaItems: MediaItem[], layout: string) {
  if (mediaItems.length === 0) return null

  if (mediaItems.length === 1) {
    // Single media item - featured layout
    const item = mediaItems[0]
    return (
      <div className="relative w-full max-h-[600px] bg-black flex items-center justify-center">
        {item.type === "video" ? (
          <video
            src={item.url}
            className="max-w-full max-h-[600px] object-contain"
            controls
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <OptimizedMediaImage
            src={item.url || ""}
            alt="Post media"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
            objectFit="contain"
            priority
            className="max-h-[600px]"
          />
        )}
      </div>
    )
  }

  // Multiple media items - grid layout
  const gridCols = mediaItems.length === 2 ? "grid-cols-2" :
                   mediaItems.length === 3 ? "grid-cols-3" :
                   "grid-cols-2"

  return (
    <div className={cn("grid gap-1 max-h-[600px]", gridCols)}>
      {mediaItems.slice(0, 4).map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "relative aspect-square overflow-hidden",
            mediaItems.length === 3 && index === 0 ? "row-span-2" : "",
            mediaItems.length > 4 && index === 3 ? "relative" : ""
          )}
        >
          {item.type === "video" ? (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              preload="metadata"
            />
          ) : (
            <OptimizedMediaImage
              src={item.url || ""}
              alt={`Post media ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              objectFit="cover"
              priority={index < 2}
            />
          )}

          {/* Show +N overlay for more than 4 items */}
          {mediaItems.length > 4 && index === 3 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-xl font-semibold">
                +{mediaItems.length - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
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
      {renderMediaGallery(mediaItems, galleryLayout)}
    </div>
  )
}
