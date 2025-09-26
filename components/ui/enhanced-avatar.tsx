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
  fallbackText?: string // For passing display name/username directly
  size?: "sm" | "md" | "lg" // Size variants
  className?: string
  fallbackClassName?: string
}

export function EnhancedAvatar({ src, alt = "Avatar", fallback, fallbackText, size = "md", className, fallbackClassName }: EnhancedAvatarProps) {
  const [imageError, setImageError] = useState(false)

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base"
  }

  // Generate initials from fallbackText, alt text, or fallback
  const getInitials = () => {
    if (fallback) return fallback

    const nameToUse = fallbackText || alt
    if (nameToUse && nameToUse !== "Avatar") {
      // If the name contains a space, use first letter of first and last name
      if (nameToUse.includes(" ")) {
        const nameParts = nameToUse.split(" ")
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase()
      }

      // If it's a single name or username, use up to 2 characters
      return nameToUse.substring(0, 2).toUpperCase()
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

  const finalImageSrc = getImageSrc()

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {finalImageSrc && !imageError ? (
        <AvatarImage src={finalImageSrc} alt={alt} onError={() => setImageError(true)} />
      ) : null}
      <AvatarFallback className={cn("bg-pink-100 text-pink-800", fallbackClassName)}>{getInitials()}</AvatarFallback>
    </Avatar>
  )
}
