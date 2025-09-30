"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface OptimizedMediaImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
  showPlaceholder?: boolean
}

export function OptimizedMediaImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  objectFit = "cover",
  showPlaceholder = true,
}: OptimizedMediaImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Handle blob URLs (for optimistic previews)
  if (src && src.startsWith("blob:")) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn("transition-opacity duration-300", className)}
        style={{ objectFit }}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    )
  }

  // Handle error state
  if (hasError) {
    return (
      <div
        className={cn(
          "bg-gray-100 flex items-center justify-center text-gray-400 text-sm",
          className
        )}
        style={{ width, height }}
      >
        Image unavailable
      </div>
    )
  }

  // Normalize URL for Strapi
  const normalizedSrc = src?.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"}${src}`
    : src

  if (fill) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={normalizedSrc}
          alt={alt}
          fill
          sizes={sizes || "100vw"}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          style={{ objectFit }}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
        {isLoading && showPlaceholder && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Image
        src={normalizedSrc}
        alt={alt}
        width={width || 600}
        height={height || 400}
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        style={{ objectFit }}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
      {isLoading && showPlaceholder && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  )
}
