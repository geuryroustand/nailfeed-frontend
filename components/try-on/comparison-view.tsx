"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Share2, RotateCcw } from "lucide-react"
import { saveImage, shareImage } from "@/lib/try-on-utils"

interface ComparisonViewProps {
  originalImage: string
  resultImage: string
  onReset: () => void
}

export function ComparisonView({ originalImage, resultImage, onReset }: ComparisonViewProps) {
  const [showComparison, setShowComparison] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      saveImage(resultImage, "nail-design-try-on.png")
    } catch (error) {
      console.error("Error saving image:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      await shareImage(resultImage, "My Virtual Nail Design")
    } catch (error) {
      console.error("Error sharing image:", error)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-lg overflow-hidden">
        {showComparison ? (
          <div className="grid grid-cols-2 h-full">
            <div className="border-r border-white/20">
              <img src={originalImage || "/placeholder.svg"} alt="Original" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 p-2 bg-black/50 text-white text-xs">Original</div>
            </div>
            <div>
              <img src={resultImage || "/placeholder.svg"} alt="Result" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 right-0 p-2 bg-black/50 text-white text-xs">Result</div>
            </div>
          </div>
        ) : (
          <img src={resultImage || "/placeholder.svg"} alt="Result" className="w-full h-full object-contain" />
        )}

        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          onClick={() => setShowComparison(!showComparison)}
        >
          {showComparison ? "Show Result" : "Compare"}
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
            <Download className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button variant="default" size="sm" onClick={handleShare} disabled={isSharing}>
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        </div>
      </div>
    </div>
  )
}
