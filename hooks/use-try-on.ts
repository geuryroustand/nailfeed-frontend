// hooks/use-try-on.ts
"use client"

import { useState } from "react"
import { applyNailDesign } from "@/lib/try-on-utils"

export function useTryOn() {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Apply a nail design to a hand image using a simplified, browser-safe method.
   * @param handImageSrc Source of the hand image (data URL).
   * @param designImageSrc Source of the nail design image (URL).
   * @returns Promise resolving to the processed image data URL.
   */
  const applyDesign = async (handImageSrc: string, designImageSrc: string): Promise<string> => {
    setIsLoading(true)
    console.log("Starting simplified design application process...")

    try {
      // Directly call the simplified applyNailDesign function.
      // This function no longer uses MediaPipe.
      const result = await applyNailDesign(handImageSrc, designImageSrc)
      console.log("Simplified design application completed successfully.")
      return result
    } catch (error) {
      console.error("Error in simplified applyDesign:", error)
      // If an error occurs, return the original image to avoid a broken state.
      return handImageSrc
    } finally {
      setIsLoading(false)
    }
  }

  return {
    applyDesign,
    isLoading,
  }
}
