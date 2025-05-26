"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { saveImage, shareImage } from "@/lib/try-on-utils"
import { Download, Share2, RotateCcw } from "lucide-react"

interface ComparisonViewProps {
  originalImage: string
  resultImage: string
  onReset: () => void
}

export function ComparisonView({ originalImage, resultImage, onReset }: ComparisonViewProps) {
  const [sliderValue, setSliderValue] = useState(50)

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0])
  }

  const handleSave = () => {
    saveImage(resultImage)
  }

  const handleShare = async () => {
    const shared = await shareImage(resultImage)
    if (!shared) {
      // If sharing failed, fall back to download
      handleSave()
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-lg overflow-hidden mb-4">
        <div className="absolute inset-0 w-full h-full">
          <img
            src={originalImage || "/placeholder.svg"}
            alt="Original"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 h-full overflow-hidden" style={{ width: `${sliderValue}%` }}>
          <img
            src={resultImage || "/placeholder.svg"}
            alt="Result"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: `${100 / (sliderValue / 100)}%` }}
          />
        </div>
        <div className="absolute inset-y-0 w-1 bg-white" style={{ left: `${sliderValue}%` }} />
      </div>

      <div className="w-full max-w-md mb-6">
        <Slider value={[sliderValue]} min={0} max={100} step={1} onValueChange={handleSliderChange} className="my-4" />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Original</span>
          <span>Result</span>
        </div>
      </div>

      <div className="flex gap-3 w-full justify-center">
        <Button variant="outline" size="icon" onClick={onReset} className="rounded-full h-12 w-12">
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button onClick={handleSave} className="rounded-full h-12 w-12" size="icon">
          <Download className="h-5 w-5" />
        </Button>

        <Button variant="outline" size="icon" onClick={handleShare} className="rounded-full h-12 w-12">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
