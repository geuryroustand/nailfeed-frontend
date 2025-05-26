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
    // Pre-load the design image to ensure it's ready when needed
    const img = new Image()
    img.src = designImageUrl

    // Open the modal
    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
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
