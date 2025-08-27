"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SafeImage } from "@/components/safe-image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface MediaItem {
  url: string
  type?: string
  alt?: string
  width?: number
  height?: number
}

interface EnhancedMediaGalleryProps {
  mediaItems: MediaItem[]
  layout?: "grid" | "carousel" | "featured"
  className?: string
}

function MediaRenderer({
  item,
  className,
  width,
  height,
  showPlaceholder = false,
}: {
  item: MediaItem
  className?: string
  width?: number
  height?: number
  showPlaceholder?: boolean
}) {
  if (item.type === "video") {
    return (
      <video
        src={item.url || "/placeholder.svg"}
        className={className}
        width={width}
        height={height}
        controls
        preload="metadata"
        style={{ objectFit: "cover" }}
      >
        Your browser does not support the video tag.
      </video>
    )
  }

  return (
    <SafeImage
      src={item.url || "/placeholder.svg"}
      alt={item.alt || "Post image"}
      className={className}
      width={width}
      height={height}
      showPlaceholder={showPlaceholder}
    />
  )
}

function EnhancedMediaGallery({ mediaItems, layout = "grid", className }: EnhancedMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Handle empty media items
  if (!mediaItems || mediaItems.length === 0) {
    return null
  }

  // Handle single image
  if (mediaItems.length === 1) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <div
          className="cursor-pointer"
          onClick={() => setLightboxOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Open image in lightbox"
        >
          <div className="w-full">
            <MediaRenderer
              item={mediaItems[0]}
              className="w-full h-auto object-cover"
              width={800}
              height={600}
              showPlaceholder={false}
            />
          </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-5xl p-0 bg-transparent border-none">
              <div className="relative">
                <MediaRenderer
                  item={mediaItems[0]}
                  className="w-full h-auto max-h-[80vh] object-contain"
                  width={1200}
                  height={900}
                  showPlaceholder={false}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  // Grid layout (default for multiple images)
  if (layout === "grid") {
    return (
      <div className={cn("grid gap-1", className)}>
        <div
          className={cn(
            "grid gap-1",
            mediaItems.length === 2 && "grid-cols-2",
            mediaItems.length === 3 && "grid-cols-2",
            mediaItems.length >= 4 && "grid-cols-2",
          )}
        >
          {/* First image (larger if 3 images) */}
          <div
            className={cn("cursor-pointer", mediaItems.length === 3 && "row-span-2")}
            onClick={() => {
              setCurrentIndex(0)
              setLightboxOpen(true)
            }}
            role="button"
            tabIndex={0}
            aria-label="Open image in lightbox"
          >
            <MediaRenderer
              item={mediaItems[0]}
              className="w-full h-full object-cover"
              width={400}
              height={400}
              showPlaceholder={false}
            />
          </div>

          {/* Second image */}
          <div
            className="cursor-pointer"
            onClick={() => {
              setCurrentIndex(1)
              setLightboxOpen(true)
            }}
            role="button"
            tabIndex={0}
            aria-label="Open image in lightbox"
          >
            <MediaRenderer
              item={mediaItems[1]}
              className="w-full h-full object-cover"
              width={400}
              height={200}
              showPlaceholder={false}
            />
          </div>

          {/* Third image (if available) */}
          {mediaItems.length >= 3 && (
            <div
              className="cursor-pointer"
              onClick={() => {
                setCurrentIndex(2)
                setLightboxOpen(true)
              }}
              role="button"
              tabIndex={0}
              aria-label="Open image in lightbox"
            >
              <MediaRenderer
                item={mediaItems[2]}
                className="w-full h-full object-cover"
                width={400}
                height={200}
                showPlaceholder={false}
              />
            </div>
          )}

          {/* Fourth image with overlay for more (if available) */}
          {mediaItems.length >= 4 && (
            <div
              className="cursor-pointer relative"
              onClick={() => {
                setCurrentIndex(3)
                setLightboxOpen(true)
              }}
              role="button"
              tabIndex={0}
              aria-label="Open image in lightbox"
            >
              <MediaRenderer
                item={mediaItems[3]}
                className="w-full h-full object-cover"
                width={400}
                height={200}
                showPlaceholder={false}
              />
              {mediaItems.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-semibold">
                  +{mediaItems.length - 4}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-5xl p-0 bg-transparent border-none">
              <div className="relative">
                <div className="relative">
                  <MediaRenderer
                    item={mediaItems[currentIndex]}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    width={1200}
                    height={900}
                    showPlaceholder={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 gap-2">
                    {mediaItems.map((_, index) => (
                      <button
                        key={index}
                        className={cn("w-2 h-2 rounded-full", index === currentIndex ? "bg-white" : "bg-white/50")}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentIndex(index)
                        }}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))
                    }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))
                    }}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  // Carousel layout
  if (layout === "carousel") {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {mediaItems.map((item, index) => (
            <div
              key={index}
              className="min-w-full flex-shrink-0 snap-center cursor-pointer"
              onClick={() => {
                setCurrentIndex(index)
                setLightboxOpen(true)
              }}
              role="button"
              tabIndex={0}
              aria-label={`View image ${index + 1}`}
            >
              <MediaRenderer
                item={item}
                className="w-full h-auto object-cover"
                width={800}
                height={600}
                showPlaceholder={false}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
          {mediaItems.map((_, index) => (
            <div
              key={index}
              className={cn("w-2 h-2 rounded-full", index === currentIndex ? "bg-white" : "bg-white/50")}
            />
          ))}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-5xl p-0 bg-transparent border-none">
              <div className="relative">
                <div className="relative">
                  <MediaRenderer
                    item={mediaItems[currentIndex]}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    width={1200}
                    height={900}
                    showPlaceholder={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 gap-2">
                    {mediaItems.map((_, index) => (
                      <button
                        key={index}
                        className={cn("w-2 h-2 rounded-full", index === currentIndex ? "bg-white" : "bg-white/50")}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentIndex(index)
                        }}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))
                    }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))
                    }}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  // Featured layout (first image large, rest in a row below)
  return (
    <div className={cn("space-y-1", className)}>
      {/* Featured image */}
      <div
        className="cursor-pointer"
        onClick={() => {
          setCurrentIndex(0)
          setLightboxOpen(true)
        }}
        role="button"
        tabIndex={0}
        aria-label="Open image in lightbox"
      >
        <MediaRenderer
          item={mediaItems[0]}
          className="w-full h-auto object-cover"
          width={800}
          height={500}
          showPlaceholder={false}
        />
      </div>

      {/* Thumbnails row */}
      <div className="grid grid-cols-4 gap-1">
        {mediaItems.slice(1, 5).map((item, index) => (
          <div
            key={index}
            className="cursor-pointer"
            onClick={() => {
              setCurrentIndex(index + 1)
              setLightboxOpen(true)
            }}
            role="button"
            tabIndex={0}
            aria-label={`Open image ${index + 2} in lightbox`}
          >
            <MediaRenderer
              item={item}
              className="w-full h-auto object-cover aspect-square"
              width={200}
              height={200}
              showPlaceholder={false}
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-5xl p-0 bg-transparent border-none">
            <div className="relative">
              <div className="relative">
                <MediaRenderer
                  item={mediaItems[currentIndex]}
                  className="w-full h-auto max-h-[80vh] object-contain"
                  width={1200}
                  height={900}
                  showPlaceholder={false}
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 gap-2">
                  {mediaItems.map((_, index) => (
                    <button
                      key={index}
                      className={cn("w-2 h-2 rounded-full", index === currentIndex ? "bg-white" : "bg-white/50")}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentIndex(index)
                      }}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Replace the default export with a named export
export { EnhancedMediaGallery }

// Keep the default export as well for backward compatibility
export default EnhancedMediaGallery
