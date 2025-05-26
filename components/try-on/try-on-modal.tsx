"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import { CameraCapture } from "./camera-capture"
import { ComparisonView } from "./comparison-view"
import { useTryOn } from "@/hooks/use-try-on"

interface TryOnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  designImageUrl: string
  designTitle?: string
}

export function TryOnModal({ open, onOpenChange, designImageUrl, designTitle = "Nail Design" }: TryOnModalProps) {
  const [activeTab, setActiveTab] = useState("camera")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const { applyDesign, isLoading } = useTryOn()

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      setCapturedImage(null)
      setProcessedImage(null)
      setActiveTab("camera")
    }
  }, [open])

  // Validate design image when it changes
  useEffect(() => {
    if (!designImageUrl) return

    // Check if the image is a local path (starts with /)
    const isLocalPath = designImageUrl.startsWith("/") && !designImageUrl.startsWith("//")

    // For local images, we can skip validation
    if (isLocalPath) {
      console.log("TryOnModal - Using local image path:", designImageUrl)
      return
    }

    // For external images, validate
    const img = new Image()
    img.onload = () => {
      console.log("TryOnModal - Design image validated successfully:", designImageUrl)
    }
    img.onerror = (error) => {
      console.error("TryOnModal - Failed to validate design image:", designImageUrl, error)
    }
    img.crossOrigin = "anonymous"
    img.src = designImageUrl
  }, [designImageUrl])

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc)
    setActiveTab("preview")
  }

  const handleApplyDesign = async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    try {
      // Apply the design to the captured image
      const result = await applyDesign(capturedImage, designImageUrl)
      setProcessedImage(result)
      setActiveTab("result")
    } catch (error) {
      console.error("Error applying design:", error)
      // Handle error
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!processedImage) return

    const link = document.createElement("a")
    link.href = processedImage
    link.download = `nail-design-${new Date().getTime()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (!processedImage) return

    try {
      // Convert the data URL to a blob
      const response = await fetch(processedImage)
      const blob = await response.blob()

      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: designTitle,
          text: "Check out my nail design!",
          files: [new File([blob], "nail-design.png", { type: "image/png" })],
        })
      } else {
        // Fallback if Web Share API is not available
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "nail-design.png"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error sharing image:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Try On Nail Design</DialogTitle>
          <DialogDescription>
            Take a photo of your hand to see how this nail design would look on you.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="camera">Capture</TabsTrigger>
            <TabsTrigger value="preview" disabled={!capturedImage}>
              Preview
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!processedImage}>
              Result
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-4">
            <CameraCapture onCapture={handleCapture} />
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            {capturedImage && (
              <div className="flex flex-col items-center">
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured hand"
                  className="max-w-full h-auto rounded-md mb-4"
                />
                <Button onClick={handleApplyDesign} disabled={isProcessing || isLoading} className="w-full">
                  {isProcessing ? "Processing..." : "Apply Design"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="result" className="mt-4">
            {processedImage && (
              <div className="flex flex-col items-center">
                <ComparisonView beforeImage={capturedImage!} afterImage={processedImage} />

                <div className="flex gap-2 mt-4 w-full">
                  <Button onClick={handleDownload} className="flex-1" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleShare} className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
