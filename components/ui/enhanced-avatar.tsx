"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface EnhancedAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  className?: string
  fallbackClassName?: string
}

export function EnhancedAvatar({ src, alt = "Avatar", fallback, className, fallbackClassName }: EnhancedAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageDebugInfo, setImageDebugInfo] = useState<{ url: string; status?: number; error?: string } | null>(null)

  // Generate fallback text from alt text if no fallback provided
  const getFallbackText = () => {
    if (fallback) return fallback

    if (alt && alt !== "Avatar") {
      return alt
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    }

    return "U"
  }

  // Normalize image URL
  const getImageSrc = () => {
    if (!src) return ""

    // Handle relative URLs from API
    if (src.startsWith("/uploads/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      // Remove trailing slash from API URL to prevent double slashes
      const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl
      return `${baseUrl}${src}`
    }

    // Handle full URLs that might be missing protocol
    if (src.startsWith("//")) {
      return `https:${src}`
    }

    return src
  }

  // Add this after the getImageSrc function
  useEffect(() => {
    if (src) {
      console.log("Avatar image source:", src)
      console.log("Normalized image URL:", getImageSrc())
    }
  }, [src])

  // Fetch image info for debugging
  useEffect(() => {
    if (src) {
      const imageUrl = getImageSrc()
      setImageDebugInfo({ url: imageUrl })

      // Only fetch if it's a real URL
      if (imageUrl && !imageUrl.includes("placeholder")) {
        fetch(imageUrl, { method: "HEAD" })
          .then((response) => {
            setImageDebugInfo((prev) => ({
              ...prev,
              status: response.status,
              error: response.ok ? undefined : `Error: ${response.status} ${response.statusText}`,
            }))
          })
          .catch((error) => {
            setImageDebugInfo((prev) => ({
              ...prev,
              error: `Fetch error: ${error.message}`,
            }))
          })
      }
    }
  }, [src])

  return (
    <Avatar className={className}>
      {src && !imageError ? (
        <AvatarImage src={getImageSrc() || "/placeholder.svg"} alt={alt} onError={() => setImageError(true)} />
      ) : null}
      <AvatarFallback className={cn("bg-pink-100 text-pink-800", fallbackClassName)}>
        {getFallbackText()}
      </AvatarFallback>
    </Avatar>
  )
}
