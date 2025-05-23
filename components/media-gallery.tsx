"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, ImageOff, ArrowLeft } from "lucide-react"
import type { MediaItem as MediaItemType } from "@/types/media"
import type { GalleryLayout } from "@/lib/services/post-service"
import { MediaItem } from "./media-item"

interface MediaGalleryProps {
  items: MediaItemType[]
  layout?: GalleryLayout
  editable?: boolean
  onRemove?: (id: string) => void
  maxHeight?: number
  className?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export default function MediaGallery({
  items,
  layout = "grid",
  editable = false,
  onRemove,
  maxHeight = 500,
  className = "",
}: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mediaItems, setMediaItems] = useState<MediaItemType[]>([])
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({})
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "detail">(layout === "grid" ? "grid" : "detail")
  const carouselRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  // Move useCallback hooks here, before any conditional logic
  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))
    setTimeout(() => setIsTransitioning(false), 300) // Match transition duration
  }, [mediaItems.length, isTransitioning])

  const goToPrev = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))
    setTimeout(() => setIsTransitioning(false), 300) // Match transition duration
  }, [mediaItems.length, isTransitioning])

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || index === activeIndex) return
      setIsTransitioning(true)
      setActiveIndex(index)
      setTimeout(() => setIsTransitioning(false), 300) // Match transition duration
    },
    [activeIndex, isTransitioning],
  )

  // Reset viewMode when layout changes
  useEffect(() => {
    setViewMode(layout === "grid" ? "grid" : "detail")
  }, [layout])

  // Process media items to ensure they have valid URLs
  useEffect(() => {
    if (!items || items.length === 0) {
      setMediaItems([])
      return
    }

    // Process each item to ensure it has a valid URL
    const processedItems = items
      .map((item) => {
        // Skip items with placeholder URLs
        if (typeof item.url === "string" && item.url.includes("placeholder.svg")) {
          return null
        }

        const getItemUrl = (item: MediaItemType): string => {
          // If the item has a direct URL property, use it
          if (item.url) {
            return item.url
          }

          // If the item has file with formats, extract the URL
          if (item.file && item.file.formats) {
            const formats = item.file.formats
            const formatUrl = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || formats.large?.url

            if (formatUrl) {
              const fullUrl = formatUrl.startsWith("http") ? formatUrl : `${API_BASE_URL}${formatUrl}`
              return fullUrl
            }
          }

          // If the item has a direct file URL
          if (item.file && item.file.url) {
            const fullUrl = item.file.url.startsWith("http") ? item.file.url : `${API_BASE_URL}${item.file.url}`
            return fullUrl
          }

          // If the item has attributes with URL
          if (item.attributes && item.attributes.url) {
            const fullUrl = item.attributes.url.startsWith("http")
              ? item.attributes.url
              : `${API_BASE_URL}${item.attributes.url}`
            return fullUrl
          }

          // If the item has attributes with formats
          if (item.attributes && item.attributes.formats) {
            const formats = item.attributes.formats
            const formatUrl = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || formats.large?.url

            if (formatUrl) {
              const fullUrl = formatUrl.startsWith("http") ? formatUrl : `${API_BASE_URL}${formatUrl}`
              return fullUrl
            }
          }

          // For newly created posts, we might need to construct a URL based on the item ID
          if (item.id) {
            // This is a fallback approach - the actual URL structure depends on your backend
            const fallbackUrl = `${API_BASE_URL}/uploads/media-items/${item.id}.jpg`
            return fallbackUrl
          }

          // If all else fails, return a placeholder
          return "/intricate-nail-art.png"
        }

        const url = getItemUrl(item)

        return {
          ...item,
          url,
        }
      })
      .filter(Boolean) as MediaItemType[] // Filter out null items

    setMediaItems(processedItems)
    // Reset load errors when items change
    setLoadErrors({})
    // Reset active index when items change
    setActiveIndex(0)
  }, [items])

  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div className={`w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <ImageOff className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No media available</p>
        </div>
      </div>
    )
  }

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove(id)
    }
  }

  const handleMediaError = (id: string) => {
    setLoadErrors((prev) => ({ ...prev, [id]: true }))
  }

  // Handle grid item click - switch to detail mode and set active index
  const handleGridItemClick = (index: number) => {
    setActiveIndex(index)
    setViewMode("detail")
  }

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    // Detect swipe (with a threshold of 50px)
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left, go to next
        goToNext()
      } else {
        // Swipe right, go to prev
        goToPrev()
      }
    }

    touchStartX.current = null
  }

  // Render grid layout
  function renderGrid() {
    if (mediaItems.length === 1) {
      const item = mediaItems[0]
      return (
        <div className="relative w-full rounded-lg overflow-hidden" style={{ minHeight: "200px" }}>
          <MediaItem
            src={item.url}
            alt="Media preview"
            type={item.type}
            objectFit="cover"
            className="rounded-lg cursor-pointer"
            style={{ maxHeight: `${maxHeight}px` }}
            onError={() => handleMediaError(item.id)}
            onClick={() => handleGridItemClick(0)}
          />

          {editable && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10"
              onClick={(e) => handleRemove(item.id, e)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )
    }

    // For 2 items
    if (mediaItems.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1" style={{ minHeight: "150px" }}>
          {mediaItems.map((item, index) => (
            <div
              key={item.id}
              className="relative rounded-lg overflow-hidden cursor-pointer"
              style={{ minHeight: "150px" }}
              onClick={() => handleGridItemClick(index)}
            >
              <MediaItem
                src={item.url}
                alt={`Media ${index + 1}`}
                type={item.type}
                objectFit="cover"
                className="rounded-lg"
                style={{ maxHeight: `${maxHeight / 2}px` }}
                onError={() => handleMediaError(item.id)}
              />

              {editable && onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10"
                  onClick={(e) => handleRemove(item.id, e)}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )
    }

    // For 3 items
    if (mediaItems.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1" style={{ minHeight: "200px" }}>
          <div
            className="relative rounded-lg overflow-hidden cursor-pointer"
            style={{ minHeight: "200px" }}
            onClick={() => handleGridItemClick(0)}
          >
            <MediaItem
              src={mediaItems[0].url}
              alt="Media 1"
              type={mediaItems[0].type}
              objectFit="cover"
              className="rounded-lg"
              style={{ maxHeight: `${maxHeight}px` }}
              onError={() => handleMediaError(mediaItems[0].id)}
            />

            {editable && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10"
                onClick={(e) => handleRemove(mediaItems[0].id, e)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="grid grid-rows-2 gap-1">
            {mediaItems.slice(1, 3).map((item, index) => (
              <div
                key={item.id}
                className="relative rounded-lg overflow-hidden cursor-pointer"
                style={{ minHeight: "99px" }}
                onClick={() => handleGridItemClick(index + 1)}
              >
                <MediaItem
                  src={item.url}
                  alt={`Media ${index + 2}`}
                  type={item.type}
                  objectFit="cover"
                  className="rounded-lg"
                  style={{ maxHeight: `${maxHeight / 2 - 2}px` }}
                  onError={() => handleMediaError(item.id)}
                />

                {editable && onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-6 w-6 z-10"
                    onClick={(e) => handleRemove(item.id, e)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // For 4 or more items
    return (
      <div className="grid grid-cols-2 gap-1" style={{ minHeight: "200px" }}>
        {mediaItems.slice(0, 4).map((item, index) => (
          <div
            key={item.id}
            className="relative rounded-lg overflow-hidden cursor-pointer"
            style={{ minHeight: "99px" }}
            onClick={() => handleGridItemClick(index)}
          >
            <MediaItem
              src={item.url}
              alt={`Media ${index + 1}`}
              type={item.type}
              objectFit="cover"
              className="rounded-lg"
              style={{ maxHeight: `${maxHeight / 2 - 2}px` }}
              onError={() => handleMediaError(item.id)}
            />

            {editable && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-6 w-6 z-10"
                onClick={(e) => handleRemove(item.id, e)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {index === 3 && mediaItems.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg z-5">
                +{mediaItems.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Render detail view (carousel)
  function renderDetailView() {
    return (
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{ minHeight: "300px", height: `${maxHeight}px` }}
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Back button to return to grid */}
        {layout === "grid" && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-30"
            onClick={() => setViewMode("grid")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Main carousel container */}
        <div className="flex w-full h-full">
          {/* Current slide */}
          <div className="w-full h-full relative">
            <MediaItem
              src={mediaItems[activeIndex]?.url}
              alt={`Slide ${activeIndex + 1}`}
              type={mediaItems[activeIndex]?.type}
              objectFit="contain"
              className="bg-gray-50"
              onError={() => handleMediaError(mediaItems[activeIndex].id)}
            />

            {/* Counter indicator */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {activeIndex + 1}/{mediaItems.length}
              </div>
            )}

            {/* Remove button */}
            {editable && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10"
                onClick={(e) => handleRemove(mediaItems[activeIndex].id, e)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation arrows */}
        {mediaItems.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 z-20 shadow-md"
              onClick={goToPrev}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 z-20 shadow-md"
              onClick={goToNext}
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Indicators */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all shadow-sm ${
                  index === activeIndex ? "bg-white w-6" : "bg-white/70 w-2 hover:bg-white/90"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Featured layout implementation
  function renderFeatured() {
    const featuredItem = mediaItems[activeIndex]

    return (
      <div className="space-y-3">
        {/* Main featured item */}
        <div
          className="relative w-full rounded-lg overflow-hidden"
          style={{ minHeight: "250px", height: `${maxHeight - 80}px` }}
        >
          <MediaItem
            src={featuredItem.url}
            alt="Featured media"
            type={featuredItem.type}
            objectFit="cover"
            onError={() => handleMediaError(featuredItem.id)}
          />

          {/* Navigation arrows for featured view */}
          {mediaItems.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 z-10 shadow-md"
                onClick={goToPrev}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 z-10 shadow-md"
                onClick={goToNext}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Counter indicator */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {activeIndex + 1}/{mediaItems.length}
            </div>
          )}

          {/* Remove button */}
          {editable && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10"
              onClick={(e) => handleRemove(featuredItem.id, e)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Thumbnails row */}
        {mediaItems.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x scrollbar-hide">
            {mediaItems.map((item, index) => (
              <div
                key={item.id}
                className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden snap-start transition-all cursor-pointer ${
                  index === activeIndex ? "ring-2 ring-pink-500 scale-105" : "opacity-70 hover:opacity-90"
                }`}
                onClick={() => goToSlide(index)}
                role="button"
                tabIndex={0}
                aria-label={`View item ${index + 1}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    goToSlide(index)
                  }
                }}
              >
                <MediaItem
                  src={item.url}
                  alt={`Thumbnail ${index + 1}`}
                  type={item.type}
                  objectFit="cover"
                  width={64}
                  height={64}
                  isActive={index === activeIndex}
                  onError={() => handleMediaError(`thumb-${item.id}`)}
                />

                {editable && onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 bg-black/50 hover:bg-black/70 text-white rounded-full h-4 w-4 z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(item.id, e)
                    }}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Render the appropriate layout based on the layout prop and viewMode
  if (layout === "carousel") {
    return <div className={`w-full ${className}`}>{renderDetailView()}</div>
  } else if (layout === "featured") {
    return <div className={`w-full ${className}`}>{renderFeatured()}</div>
  } else {
    // Grid layout with potential detail view
    return <div className={`w-full ${className}`}>{viewMode === "grid" ? renderGrid() : renderDetailView()}</div>
  }
}
