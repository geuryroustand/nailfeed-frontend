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
  variant = "default",
  size = "default",
  showIcon = true,
}: TryOnButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    console.log("TryOnButton - Opening modal with image:", designImageUrl)

    // Validate the image URL
    if (!designImageUrl) {
      console.error("No design image URL provided to TryOnButton")
      return
    }

    // Pre-load the design image to ensure it's ready when needed
    const img = new Image()
    img.onload = () => {
      console.log("Design image preloaded successfully")
      setIsModalOpen(true)
    }
    img.onerror = () => {
      console.error("Failed to preload design image:", designImageUrl)
      // Still open the modal even if preload fails
      setIsModalOpen(true)
    }
    img.src = designImageUrl
  }

  return (
    <>
      <Button
        variant="secondary"
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
        designImageUrl={designImageUrl}
        designTitle={designTitle}
      />
    </>
  )
}
