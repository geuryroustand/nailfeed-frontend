"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ImageOff, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAbsoluteImageUrl } from "@/lib/image-utils"

interface MediaItemProps {
  src: string
  alt?: string
  type?: "image" | "video"
  objectFit?: "cover" | "contain"
  priority?: boolean
  width?: number
  height?: number
  className?: string
  onClick?: () => void
  onError?: () => void
  showControls?: boolean
  isActive?: boolean
  aspectRatio?: "square" | "video" | "auto"
  style?: React.CSSProperties
}

export function MediaItem({
  src,
  alt = "Media content",
  type = "image",
  objectFit = "contain",
  priority = false,
  width = 800,
  height = 600,
  className,
  onClick,
  onError,
  showControls = true,
  isActive = true,
  aspectRatio = "auto",
  style,
  ...props
}: MediaItemProps) {
  const [absoluteSrc, setAbsoluteSrc] = useState<string>(src)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const isMounted = useRef(true)

  // Track component mount state to prevent state updates after unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Get the absolute URL for the image
  useEffect(() => {
    if (!src) {
      if (isMounted.current) {
        setHasError(true)
      }
      return
    }

    // Handle blob URLs directly
    if (src.startsWith("blob:")) {
      if (isMounted.current) {
        setAbsoluteSrc(src)
      }
      return
    }

    try {
      // Get the absolute URL for the image
      const absolute = getAbsoluteImageUrl(src)
      if (isMounted.current) {
        setAbsoluteSrc(absolute)
      }
    } catch (error) {
      if (isMounted.current) {
        setHasError(true)
      }
    }
  }, [src])

  // Handle image error
  const handleImageError = () => {
    if (!isMounted.current) return

    // Don't try to fix blob URLs
    if (src.startsWith("blob:")) {
      setHasError(true)
      if (onError) onError()
      return
    }

    // Try to fix the URL if it's a relative path
    if (src.startsWith("/uploads/")) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const fixedUrl = `${apiBaseUrl}${src}`
      setAbsoluteSrc(fixedUrl)
      return
    }

    setHasError(true)
    if (onError) onError()
  }

  // Handle video error
  const handleVideoError = () => {
    if (!isMounted.current) return
    setHasError(true)
    if (onError) onError()
  }

  // Handle click
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  // Get aspect ratio class
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square"
      case "video":
        return "aspect-video"
      default:
        return "aspect-auto"
    }
  }

  // Render error state
  if (hasError && type === "image") {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center bg-gray-100 w-full h-full",
          getAspectRatioClass(),
          className,
        )}
        style={style}
        onClick={handleClick}
      >
        <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Image unavailable</p>
      </div>
    )
  }

  // Render video
  if (type === "video") {
    return (
      <div
        className={cn("relative w-full h-full", getAspectRatioClass(), className)}
        style={style}
        onClick={handleClick}
      >
        <video
          src={absoluteSrc}
          className={cn("w-full h-full", objectFit === "cover" ? "object-cover" : "object-contain")}
          controls={showControls}
          muted
          playsInline
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          {...props}
        />

        {/* Play button overlay when paused and controls are hidden */}
        {!isPlaying && !showControls && (
          <div className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20">
            <div className="rounded-full bg-white/80 p-3 backdrop-blur-sm">
              <Play className="h-6 w-6 text-pink-500" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render image
  if (!absoluteSrc) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center bg-gray-100 w-full h-full",
          getAspectRatioClass(),
          className,
        )}
        style={style}
      >
        <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Image unavailable</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative w-full h-full flex items-center justify-center bg-black",
        getAspectRatioClass(),
        className,
      )}
      style={style}
      onClick={handleClick}
    >
      <Image
        src={absoluteSrc || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "w-full h-full",
          objectFit === "cover" ? "object-cover" : "object-contain",
          !isActive && "opacity-70",
          onClick && "cursor-pointer",
        )}
        onError={handleImageError}
        unoptimized={true}
        {...props}
      />
    </div>
  )
}
