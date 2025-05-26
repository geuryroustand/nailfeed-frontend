"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { TryOnModal } from "./try-on-modal"

interface TryOnButtonProps {
  designImageUrl: string
  designTitle?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  onClick?: () => void
}

export function TryOnButton({
  designImageUrl,
  designTitle = "Nail Design",
  className = "",
  variant = "secondary",
  size = "default",
  showIcon = true,
  onClick,
}: TryOnButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [validatedImageUrl, setValidatedImageUrl] = useState<string>(
    designImageUrl || "/placeholder.svg?height=400&width=400&text=Nail+Design",
  )

  // Validate the image URL when the component mounts or when designImageUrl changes
  useEffect(() => {
    // Debug logging
    console.log("TryOnButton - Props received:", {
      designImageUrl,
      designTitle,
      designImageUrlType: typeof designImageUrl,
      designImageUrlLength: designImageUrl?.length,
    })

    // Validate and clean the image URL
    const cleanImageUrl = designImageUrl?.trim()

    if (!cleanImageUrl || cleanImageUrl === "" || cleanImageUrl === "undefined" || cleanImageUrl === "null") {
      console.error("TryOnButton - No valid design image URL provided:", {
        original: designImageUrl,
        cleaned: cleanImageUrl,
      })

      // Use a fallback image URL
      const fallbackUrl = "/placeholder.svg?height=400&width=400&text=Nail+Design"
      console.log("TryOnButton - Using fallback image URL:", fallbackUrl)
      setValidatedImageUrl(fallbackUrl)
      return
    }

    // Check if the image is a local path (starts with /)
    const isLocalPath = cleanImageUrl.startsWith("/") && !cleanImageUrl.startsWith("//")

    // For local images, we can skip preloading or handle it differently
    if (isLocalPath) {
      console.log("TryOnButton - Using local image path:", cleanImageUrl)
      setValidatedImageUrl(cleanImageUrl)

      // Optional: Still verify the image exists but without crossOrigin
      const img = new Image()
      img.onload = () => {
        console.log("TryOnButton - Local image verified successfully:", cleanImageUrl)
      }
      img.onerror = (error) => {
        console.warn("TryOnButton - Local image verification failed, but continuing:", cleanImageUrl, error)
        // We'll still use the local path, but log a warning
      }
      // Don't set crossOrigin for local images
      img.src = cleanImageUrl
      return
    }

    // For external images, preload with crossOrigin
    const img = new Image()
    img.onload = () => {
      console.log("TryOnButton - External image preloaded successfully:", cleanImageUrl)
      setValidatedImageUrl(cleanImageUrl)
    }
    img.onerror = (error) => {
      console.error("TryOnButton - Failed to preload external image:", cleanImageUrl, error)
      // Use fallback on error
      setValidatedImageUrl("/placeholder.svg?height=400&width=400&text=Nail+Design")
    }

    // Only set crossOrigin for external images
    img.crossOrigin = "anonymous"
    img.src = cleanImageUrl
  }, [designImageUrl])

  const handleOpenModal = () => {
    // If there's a custom onClick handler, call it
    if (onClick) {
      onClick()
      return
    }

    // Otherwise, open the modal
    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200 ${className}`}
        onClick={handleOpenModal}
        aria-label="Try this design on your nails"
      >
        {showIcon && <Sparkles className="h-4 w-4 mr-2" />}
        Try this design
      </Button>

      <TryOnModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        designImageUrl={validatedImageUrl}
        designTitle={designTitle}
      />
    </>
  )
}
