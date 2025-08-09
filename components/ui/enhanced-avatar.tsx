"use client"

import { useState } from "react"
import { Avatar as BaseAvatar, AvatarFallback as BaseFallback, AvatarImage as BaseImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Re-export the components from @/components/ui/avatar
export const Avatar = BaseAvatar
export const AvatarFallback = BaseFallback
export const AvatarImage = BaseImage

interface EnhancedAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  className?: string
  fallbackClassName?: string
}

export function EnhancedAvatar({ src, alt = "Avatar", fallback, className, fallbackClassName }: EnhancedAvatarProps) {
  const [imageError, setImageError] = useState(false)

  // Generate initials from the alt text (username or display name)
  const getInitials = () => {
    if (fallback) return fallback

    if (alt && alt !== "Avatar") {
      // If the name contains a space, use first letter of first and last name
      if (alt.includes(" ")) {
        const nameParts = alt.split(" ")
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase()
      }

      // If it's a single name or username, use up to 2 characters
      return alt.substring(0, 2).toUpperCase()
    }

    return "U" // Default fallback if no name is available
  }

  // Normalize image URL
  const getImageSrc = () => {
    if (!src) return ""

    // Don't use placeholder images
    if (src.includes("placeholder.svg")) {
      return "" // Return empty to trigger fallback
    }

    // Handle relative URLs from API
    if (src.startsWith("/uploads/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      return `${apiUrl}${src}`
    }

    // Handle full URLs that might be missing protocol
    if (src.startsWith("//")) {
      return `https:${src}`
    }

    return src
  }

  return (
    <Avatar className={className}>
      {src && !imageError ? (
        <AvatarImage src={getImageSrc() || "/placeholder.svg"} alt={alt} onError={() => setImageError(true)} />
      ) : null}
      <AvatarFallback className={cn("bg-pink-100 text-pink-800", fallbackClassName)}>{getInitials()}</AvatarFallback>
    </Avatar>
  )
}
