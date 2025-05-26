"use client"

import { useState } from "react"
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
}

export function TryOnButton({
  designImageUrl,
  designTitle = "Nail Design",
  className = "",
  variant = "secondary",
  size = "default",
  showIcon = true,
}: TryOnButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
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

      // Use a fallback image URL instead of blocking the modal
      const fallbackUrl = "/placeholder.svg?height=400&width=400&text=Nail+Design"
      console.log("TryOnButton - Using fallback image URL:", fallbackUrl)

      // Still open the modal with fallback image
      setIsModalOpen(true)
      return
    }

    // Pre-load the design image to ensure it's ready when needed
    const img = new Image()
    img.onload = () => {
      console.log("TryOnButton - Design image preloaded successfully:", cleanImageUrl)
      setIsModalOpen(true)
    }
    img.onerror = (error) => {
      console.error("TryOnButton - Failed to preload design image:", cleanImageUrl, error)
      // Still open the modal even if preload fails
      setIsModalOpen(true)
    }

    // Set crossOrigin to handle CORS issues
    img.crossOrigin = "anonymous"
    img.src = cleanImageUrl
  }

  // Ensure we always have a valid image URL to pass to the modal
  const validImageUrl = designImageUrl?.trim() || "/placeholder.svg?height=400&width=400&text=Nail+Design"

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
        designImageUrl={validImageUrl}
        designTitle={designTitle}
      />
    </>
  )
}
