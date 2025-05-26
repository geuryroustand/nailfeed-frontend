"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Download, RotateCcw, Share2 } from "lucide-react"

interface ComparisonViewProps {
  originalImage: string
  resultImage: string
  onReset: () => void
}

export function ComparisonView({ originalImage, resultImage, onReset }: ComparisonViewProps) {
  const [sliderValue, setSliderValue] = useState(50)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = resultImage
    link.download = `nail-design-${new Date().getTime()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    try {
      // Convert the data URL to a blob
      const response = await fetch(resultImage)
      const blob = await response.blob()

      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: "My Nail Design",
          text: "Check out my nail design!",
          files: [new File([blob], "nail-design.png", { type: "image/png" })],
        })
      } else {
        // Fallback if Web Share API is not available
        handleDownload()
      }
    } catch (error) {
      console.error("Error sharing image:", error)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden mb-4">
        {/* Original image as background */}
        <div className="absolute inset-0">
          <img src={originalImage || "/placeholder.svg"} alt="Original" className="w-full h-full object-cover" />
        </div>

        {/* Result image with clip-path based on slider */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
          }}
        >
          <img src={resultImage || "/placeholder.svg"} alt="Result" className="w-full h-full object-cover" />
        </div>

        {/* Slider indicator line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
          style={{ left: `${sliderValue}%` }}
        ></div>

        {/* Labels */}
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Original</div>
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">With Design</div>
      </div>

      <Slider
        value={[sliderValue]}
        onValueChange={(values) => setSliderValue(values[0])}
        min={0}
        max={100}
        step={1}
        className="w-full mb-4"
      />

      <div className="flex gap-2 w-full">
        <Button variant="outline" onClick={onReset} className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button onClick={handleShare} className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  )
}
