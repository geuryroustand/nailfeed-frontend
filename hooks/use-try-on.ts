// hooks/use-try-on.ts
"use client"

import { useState } from "react"

export function useTryOn() {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Simple function to save an image to device
   * @param imageDataUrl The image data URL to save
   * @param filename The filename for the saved image
   */
  const saveImage = (imageDataUrl: string, filename = "nail-photo.png") => {
    const link = document.createElement("a")
    link.href = imageDataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Share an image using Web Share API or fallback to download
   * @param imageDataUrl The image data URL to share
   * @param title The title for sharing
   */
  const shareImage = async (imageDataUrl: string, title = "My Nail Photo"): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], "nail-photo.png", { type: "image/png" })
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text: "Check out my nail photo!",
          files: [file],
        })
        return true
      } else {
        // Fallback to download
        saveImage(imageDataUrl)
        return false
      }
    } catch (error) {
      console.error("Error sharing image:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    saveImage,
    shareImage,
    isLoading,
  }
}
