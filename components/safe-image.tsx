"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { getAbsoluteImageUrl } from "@/lib/image-utils"
import { MediaItem } from "./media-item"

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  showPlaceholder?: boolean
}

export function SafeImage({ src, alt = "Image", showPlaceholder = true, className, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!src) {
      if (isMounted.current) {
        setIsLoading(false)
        setHasError(true)
      }
      return
    }

    // Handle blob URLs directly
    if (typeof src === "string" && src.startsWith("blob:")) {
      if (isMounted.current) {
        setImgSrc(src)
        setIsLoading(false)
        setHasError(false)
      }
      return
    }

    try {
      // Get the absolute URL for the image
      const absolute = getAbsoluteImageUrl(src as string)
      if (isMounted.current) {
        setImgSrc(absolute)
        setIsLoading(false)
        setHasError(false)
      }
    } catch (error) {
      console.error("Error resolving URL:", error)
      if (isMounted.current) {
        setHasError(true)
        setIsLoading(false)
      }
    }
  }, [src])

  const handleError = () => {
    if (!isMounted.current) return

    console.error(`Failed to load image: ${imgSrc}`)

    // Don't try to fix blob URLs
    if (src && typeof src === "string" && src.startsWith("blob:")) {
      setHasError(true)
      setIsLoading(false)
      return
    }

    // Try to fix the URL if it's a relative path
    if (src && typeof src === "string" && src.startsWith("/uploads/")) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const fixedUrl = `${apiBaseUrl}${src}`
      console.log(`SafeImage: Attempting to fix URL from ${src} to ${fixedUrl}`)
      setImgSrc(fixedUrl)
      return
    }

    setHasError(true)
    setIsLoading(false)
  }

  if (isLoading && showPlaceholder) {
    return <div className={`bg-gray-200 ${className}`} {...props} role="img" aria-label={`Loading ${alt}`} />
  }

  if (hasError || !imgSrc) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} {...props}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    )
  }

  return <MediaItem src={imgSrc} alt={alt} className={className} onError={handleError} {...props} />
}
