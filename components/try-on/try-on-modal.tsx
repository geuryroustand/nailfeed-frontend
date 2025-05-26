"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
  // Create refs for video and canvas elements
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [activeTab, setActiveTab] = useState("camera")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const { applyDesign, isLoading } = useTryOn()

  // Reset state when modal closes
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

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref is not available")
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        console.error("Could not get canvas context")
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0)

      // Get the captured image as data URL
      const imageDataUrl = canvas.toDataURL("image/png")

      // Stop the camera stream
      const stream = video.srcObject as MediaStream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      // Set the captured image and move to preview tab
      setCapturedImage(imageDataUrl)
      setActiveTab("preview")
    } catch (error) {
      console.error("Error capturing photo:", error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string
      setCapturedImage(imageDataUrl)
      setActiveTab("preview")
    }
    reader.readAsDataURL(file)
  }

  const handleCancel = () => {
    // Stop any active camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }

    // Go back to the first tab
    setActiveTab("camera")
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
            <CameraCapture
              videoRef={videoRef}
              canvasRef={canvasRef}
              onCapture={handleCapture}
              onFileUpload={handleFileUpload}
              onCancel={handleCancel}
            />
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
