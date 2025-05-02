"use client"

import type React from "react"

import Image from "next/image"
import { useState, useEffect } from "react"
import { normalizeImageUrl, extractMediaUrl } from "@/lib/image-utils"

interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  fill?: boolean
  fallbackSrc?: string
  onLoad?: () => void
  onError?: () => void
  style?: React.CSSProperties
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
}

export function ResponsiveImage({
  src,
  alt,
  className = "",
  width = 500,
  height = 500,
  sizes = "100vw",
  priority = false,
  fill = false,
  fallbackSrc = "/abstract-nail-art.png",
  onLoad,
  onError,
  style,
  objectFit = "cover",
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imgSrc, setImgSrc] = useState<string>("")

  useEffect(() => {
    if (!src) {
      setHasError(true)
      return
    }

    try {
      // Reset error state when src changes
      setHasError(false)
      setIsLoading(true)

      // If it's already a full URL, use it directly
      if (src.startsWith("http")) {
        // Check for double slashes in the path part of the URL
        const url = new URL(src)
        const path = url.pathname.replace(/\/+/g, "/")
        url.pathname = path
        setImgSrc(url.toString())
        return
      }

      // Try to parse JSON if it looks like a JSON string
      if (
        typeof src === "string" &&
        (src.includes('"formats"') || src.includes('"url"') || src.includes("mediaItems"))
      ) {
        try {
          const jsonData = JSON.parse(src)
          const extractedUrl = extractMediaUrl(jsonData)
          if (extractedUrl) {
            setImgSrc(extractedUrl)
            return
          }
        } catch (e) {
          console.error("Error parsing JSON:", e)
        }
      }

      // If we get here, just normalize the src directly
      setImgSrc(normalizeImageUrl(src))
    } catch (error) {
      console.error("Error processing image URL:", error)
      setHasError(true)
    }
  }, [src])

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
    if (onLoad) onLoad()
  }

  const handleImageError = () => {
    console.error(`Failed to load image: ${imgSrc}`)
    setIsLoading(false)
    setHasError(true)
    if (onError) onError()
  }

  return (
    <div className={`relative ${className} ${isLoading ? "animate-pulse bg-gray-200" : ""}`} style={style}>
      {imgSrc &&
        !hasError &&
        (fill ? (
          <Image
            src={imgSrc || "/placeholder.svg"}
            alt={alt}
            fill
            sizes={sizes}
            quality={80}
            priority={priority}
            className="object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            unoptimized={true}
          />
        ) : (
          <Image
            src={imgSrc || "/placeholder.svg"}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            quality={80}
            priority={priority}
            className="object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            unoptimized={true}
          />
        ))}

      {(hasError || !imgSrc) && (
        <div className="flex items-center justify-center w-full h-full min-h-[200px] bg-gray-100 rounded">
          {fallbackSrc ? (
            <Image
              src={fallbackSrc || "/placeholder.svg"}
              alt={`Fallback for ${alt}`}
              width={width}
              height={height}
              className="opacity-70"
              unoptimized={true}
            />
          ) : (
            <span className="text-sm text-gray-500">Image unavailable</span>
          )}
        </div>
      )}
    </div>
  )
}
