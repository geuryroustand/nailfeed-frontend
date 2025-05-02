"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MediaItem, MediaGalleryLayout } from "@/types/media"
import { cn } from "@/lib/utils"
import { ResponsiveImage } from "@/components/ui/responsive-image"
import { normalizeImageUrl } from "@/lib/image-utils"

// Helper function to get the best available image URL from a media item
function getBestImageUrl(item: MediaItem): string {
  // If the item has formats, use the medium format or fallback to other formats
  if (item.file?.formats) {
    const formats = item.file.formats
    const url = formats.medium?.url || formats.small?.url || formats.large?.url || formats.thumbnail?.url

    if (url) {
      return normalizeImageUrl(url)
    }
  }

  // Otherwise use the direct URL
  return item.url || "/placeholder.svg"
}

interface MediaGalleryProps {
  items: MediaItem[]
  layout?: MediaGalleryLayout
  editable?: boolean
  onRemove?: (id: string) => void
  onReorder?: (newOrder: MediaItem[]) => void
  maxHeight?: number
}

function getItemClassName(index: number, length: number, layout: MediaGalleryLayout = "grid") {
  if (layout === "grid") {
    if (length === 3 && index === 0) return "sm:col-span-2 sm:row-span-2"
    if (length >= 4 && index === 0) return "col-span-2 row-span-2"
  }
  return ""
}

export default function MediaGallery({
  items,
  layout = "grid",
  editable = false,
  onRemove,
  onReorder,
  maxHeight = 500,
}: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  if (!items.length) return null

  const handleImageLoad = (id: string) => {
    setLoadingStates((prev) => ({ ...prev, [id]: false }))
  }

  const handleImageError = (id: string) => {
    setLoadingStates((prev) => ({ ...prev, [id]: false }))
    console.warn(`Failed to load image for item ${id}`)
  }

  // For single item, just show it directly
  if (items.length === 1) {
    const item = items[0]
    return (
      <div className="rounded-lg overflow-hidden relative">
        {item.type === "image" ? (
          <ResponsiveImage
            src={getBestImageUrl(item)}
            alt="Post media"
            className="w-full"
            fallbackSrc="/abstract-pastel-swirls.png"
            onLoad={() => handleImageLoad(item.id)}
            onError={() => handleImageError(item.id)}
            style={{
              maxHeight: `${maxHeight}px`,
              aspectRatio: "16/9",
            }}
          />
        ) : (
          <video
            src={item.url}
            className="w-full object-cover"
            style={{
              maxHeight: `${maxHeight}px`,
              aspectRatio: "16/9",
            }}
            controls
            onError={() => handleImageError(item.id)}
          />
        )}
        {editable && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
            onClick={() => onRemove(item.id)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    )
  }

  // For carousel layout
  if (layout === "carousel") {
    return (
      <div className="relative rounded-lg overflow-hidden">
        <div className="relative">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`transition-opacity duration-300 ${
                index === activeIndex ? "opacity-100" : "opacity-0 absolute inset-0"
              }`}
            >
              {item.type === "image" ? (
                <ResponsiveImage
                  src={getBestImageUrl(item)}
                  alt={`Media ${index + 1}`}
                  className="w-full"
                  fallbackSrc="/abstract-pastel-swirls.png"
                  onLoad={() => handleImageLoad(item.id)}
                  onError={() => handleImageError(item.id)}
                  style={{ maxHeight: `${maxHeight}px` }}
                />
              ) : (
                <video
                  src={item.url}
                  className="w-full object-cover"
                  style={{ maxHeight: `${maxHeight}px` }}
                  controls={index === activeIndex}
                  onError={() => handleImageError(item.id)}
                />
              )}
              {editable && onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                  onClick={() => onRemove(item.id)}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8"
          onClick={() => setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8"
          onClick={() => setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Indicator dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
          {items.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full ${index === activeIndex ? "bg-white" : "bg-white/50"} transition-colors`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    )
  }

  // For grid layout
  if (layout === "grid") {
    // Determine grid layout based on number of items
    let gridClass = "grid-cols-1 sm:grid-cols-2"
    if (items.length === 3) {
      gridClass = "grid-cols-1 sm:grid-cols-2"
    } else if (items.length === 4) {
      gridClass = "grid-cols-2"
    } else if (items.length > 4) {
      gridClass = "grid-cols-2 sm:grid-cols-3"
    }

    return (
      <div className={`grid ${gridClass} gap-1 rounded-lg overflow-hidden`}>
        {items.slice(0, 5).map((item, index) => (
          <div
            key={item.id || index}
            className={cn(
              "relative overflow-hidden rounded-md aspect-square",
              getItemClassName(index, items.length, layout),
            )}
          >
            {item.type === "video" ? (
              <video
                src={item.url}
                controls
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error("Video failed to load:", e)
                  handleImageError(item.id)
                  // Set a fallback image on error
                  e.currentTarget.style.display = "none"
                  const img = document.createElement("img")
                  img.src = "/video-unavailable.png"
                  img.className = "h-full w-full object-cover"
                  img.alt = "Video unavailable"
                  e.currentTarget.parentNode?.appendChild(img)
                }}
              />
            ) : (
              <ResponsiveImage
                src={getBestImageUrl(item)}
                alt={`Media ${index + 1}`}
                fill
                className="object-cover"
                fallbackSrc="/abstract-pastel-swirls.png"
                onLoad={() => handleImageLoad(item.id)}
                onError={() => handleImageError(item.id)}
              />
            )}
            {editable && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                onClick={() => onRemove(item.id)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
            {index === 4 && items.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl font-bold">+{items.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // For featured layout (first item large, others as thumbnails)
  return (
    <div className="space-y-1 rounded-lg overflow-hidden">
      <div className="relative">
        {items[activeIndex].type === "image" ? (
          <ResponsiveImage
            src={getBestImageUrl(items[activeIndex])}
            alt={`Featured media`}
            className="w-full"
            fallbackSrc="/abstract-pastel-swirls.png"
            onLoad={() => handleImageLoad(items[activeIndex].id)}
            onError={() => handleImageError(items[activeIndex].id)}
            style={{ maxHeight: `${maxHeight - 80}px` }}
          />
        ) : (
          <video
            src={items[activeIndex].url}
            className="w-full object-cover"
            style={{ maxHeight: `${maxHeight - 80}px` }}
            controls
            onError={() => handleImageError(items[activeIndex].id)}
          />
        )}
        {editable && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
            onClick={() => onRemove(items[activeIndex].id)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden ${
              index === activeIndex ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setActiveIndex(index)}
          >
            {item.type === "image" ? (
              <ResponsiveImage
                src={getBestImageUrl(item)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                fallbackSrc="/abstract-pastel-swirls.png"
                onLoad={() => handleImageLoad(`thumb-${item.id}`)}
                onError={() => handleImageError(`thumb-${item.id}`)}
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(`thumb-${item.id}`)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-black/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
