"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SafePostImageProps {
  src: string | undefined
  alt: string
  className?: string
  aspectRatio?: "square" | "video" | "auto"
  priority?: boolean
  fill?: boolean
  sizes?: string
}

export function SafePostImage({
  src,
  alt,
  className,
  aspectRatio = "video",
  priority = false,
  fill = true,
  sizes,
}: SafePostImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Reset error state if src changes
  useEffect(() => {
    if (src) {
      setImgSrc(src)
      setHasError(false)
      setIsLoading(true)
    } else {
      setHasError(true)
      setIsLoading(false)
    }
  }, [src])

  const aspectRatioClass = aspectRatio === "square" ? "aspect-square" : aspectRatio === "video" ? "aspect-video" : ""

  if (!imgSrc || hasError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center",
          aspectRatioClass,
          className,
        )}
      >
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-gray-100", aspectRatioClass, className)}>
      <Image
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        fill={fill}
        className={cn("object-cover transition-opacity duration-300")}
        onError={() => {
          console.error("Image failed to load:", src)
          setHasError(true)
        }}
        onLoadingComplete={() => {
          console.log("Image loaded successfully:", src)
          setIsLoading(false)
        }}
        priority={priority}
        sizes={sizes || "100vw"}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}
