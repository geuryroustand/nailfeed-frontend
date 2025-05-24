"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MediaItem } from "@/types/media"

interface EnhancedMediaGalleryProps {
  mediaItems: MediaItem[]
  layout?: "grid" | "carousel" | "masonry"
  className?: string
}

export function EnhancedMediaGallery({ mediaItems, layout = "grid", className = "" }: EnhancedMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  if (!mediaItems || mediaItems.length === 0) {
    return null
  }

  const currentItem = mediaItems[currentIndex]

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
  }

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  if (layout === "carousel" && mediaItems.length > 1) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg">
          {currentItem.type === "image" ? (
            <Image
              src={currentItem.url || "/placeholder.svg"}
              alt={currentItem.alt || "Media content"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={currentIndex === 0}
            />
          ) : (
            <div className="relative w-full h-full">
              <video
                src={currentItem.url}
                className="w-full h-full object-cover"
                controls={false}
                autoPlay={isPlaying}
                muted={isMuted}
                loop
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={togglePlay}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
              </div>
              <div className="absolute bottom-4 right-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleMute}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {mediaItems.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={prevItem}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={nextItem}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  // Grid layout
  if (mediaItems.length === 1) {
    const item = mediaItems[0]
    return (
      <div className={`relative aspect-square overflow-hidden rounded-lg ${className}`}>
        {item.type === "image" ? (
          <Image
            src={item.url || "/placeholder.svg"}
            alt={item.alt || "Media content"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              src={item.url}
              className="w-full h-full object-cover"
              controls={false}
              autoPlay={isPlaying}
              muted={isMuted}
              loop
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={togglePlay}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>
            <div className="absolute bottom-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleMute}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Multiple items grid
  return (
    <div className={`grid gap-1 ${className}`}>
      {mediaItems.length === 2 && (
        <div className="grid grid-cols-2 gap-1">
          {mediaItems.map((item, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
              {item.type === "image" ? (
                <Image
                  src={item.url || "/placeholder.svg"}
                  alt={item.alt || "Media content"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                />
              ) : (
                <video src={item.url} className="w-full h-full object-cover" controls={false} muted />
              )}
            </div>
          ))}
        </div>
      )}

      {mediaItems.length === 3 && (
        <div className="grid grid-cols-2 gap-1">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            {mediaItems[0].type === "image" ? (
              <Image
                src={mediaItems[0].url || "/placeholder.svg"}
                alt={mediaItems[0].alt || "Media content"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
              />
            ) : (
              <video src={mediaItems[0].url} className="w-full h-full object-cover" controls={false} muted />
            )}
          </div>
          <div className="grid grid-rows-2 gap-1">
            {mediaItems.slice(1).map((item, index) => (
              <div key={index + 1} className="relative aspect-square overflow-hidden rounded-lg">
                {item.type === "image" ? (
                  <Image
                    src={item.url || "/placeholder.svg"}
                    alt={item.alt || "Media content"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, (max-width: 1200px) 12vw, 8vw"
                  />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" controls={false} muted />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mediaItems.length >= 4 && (
        <div className="grid grid-cols-2 gap-1">
          {mediaItems.slice(0, 4).map((item, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
              {item.type === "image" ? (
                <Image
                  src={item.url || "/placeholder.svg"}
                  alt={item.alt || "Media content"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                />
              ) : (
                <video src={item.url} className="w-full h-full object-cover" controls={false} muted />
              )}
              {index === 3 && mediaItems.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">+{mediaItems.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EnhancedMediaGallery
