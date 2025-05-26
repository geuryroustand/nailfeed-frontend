"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { TryOnModal } from "./try-on-modal"

interface TryOnButtonProps {
  designImageUrl?: string
  designTitle?: string
  className?: string
  onClick?: () => void
}

export function TryOnButton({
  designImageUrl,
  designTitle = "Nail Design",
  className = "",
  onClick,
}: TryOnButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [validatedImageUrl, setValidatedImageUrl] = useState<string>(
    "/placeholder.svg?height=400&width=400&text=Nail+Design",
  )

  // Validate and preload the design image
  useEffect(() => {
    if (!designImageUrl) {
      console.warn("TryOnButton - No valid design image URL provided:", designImageUrl)
      return
    }

    // Check if the image is a local path (starts with /)
    const isLocalPath = designImageUrl.startsWith("/") && !designImageUrl.startsWith("//")

    // For local images, we can use the path directly
    if (isLocalPath) {
      console.log("TryOnButton - Using local image path:", designImageUrl)
      setValidatedImageUrl(designImageUrl)
      return
    }

    // For external images, validate with crossOrigin
    console.log("TryOnButton - Preloading design image:", designImageUrl)
    const img = new Image()

    img.onload = () => {
      console.log("TryOnButton - Design image preloaded successfully:", designImageUrl)
      setValidatedImageUrl(designImageUrl)
    }

    img.onerror = (error) => {
      console.error("TryOnButton - Failed to preload design image:", designImageUrl, error)
      // Keep using fallback image
    }

    img.crossOrigin = "anonymous"
    img.src = designImageUrl
  }, [designImageUrl])

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleClick} className={`flex items-center gap-1 ${className}`}>
        <Sparkles className="h-4 w-4" />
        Try On
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
