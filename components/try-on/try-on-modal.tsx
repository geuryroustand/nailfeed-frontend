"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Camera, Hand, ImageIcon } from "lucide-react"
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
  // Add this right after the function declaration
  useEffect(() => {
    console.log("TryOnModal props:", { designImageUrl, designTitle, open })
  }, [designImageUrl, designTitle, open])

  const [selectedTab, setSelectedTab] = useState<"info" | "camera" | "result">("info")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { applyDesign, isLoading } = useTryOn()

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedTab("info")
      setCapturedImage(null)
      setResultImage(null)
      setError(null)
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
    setSelectedTab("result")
    processImage(imageSrc)
  }

  const processImage = async (imageSrc: string) => {
    if (!imageSrc) return

    setIsProcessing(true)
    setError(null)

    try {
      // Apply the design to the captured image
      const result = await applyDesign(imageSrc, designImageUrl)
      setResultImage(result)
    } catch (err) {
      console.error("Error applying design:", err)
      setError("Failed to process the image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setCapturedImage(null)
    setResultImage(null)
    setSelectedTab("info")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Try On: {designTitle}</DialogTitle>
          <DialogDescription>Use your camera or upload a photo to virtually try on this nail design</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <Button
            variant={selectedTab === "info" ? "default" : "ghost"}
            className="flex-1 rounded-none rounded-t-lg"
            onClick={() => setSelectedTab("info")}
          >
            <Hand className="h-4 w-4 mr-2" />
            Info
          </Button>
          <Button
            variant={selectedTab === "camera" ? "default" : "ghost"}
            className="flex-1 rounded-none rounded-t-lg"
            onClick={() => setSelectedTab("camera")}
            disabled={isProcessing}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
          <Button
            variant={selectedTab === "result" ? "default" : "ghost"}
            className="flex-1 rounded-none rounded-t-lg"
            onClick={() => setSelectedTab("result")}
            disabled={!resultImage}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Result
          </Button>
        </div>

        {/* Error alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tab content */}
        <div className="py-2">
          {selectedTab === "info" && (
            <div className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={designImageUrl || "/placeholder.svg?height=300&width=400&text=Design+Image"}
                  alt={designTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Failed to load design image:", designImageUrl)
                    e.currentTarget.src = "/placeholder.svg?height=300&width=400&text=Design+Image"
                  }}
                  onLoad={() => {
                    console.log("Design image loaded successfully:", designImageUrl)
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                  <div className="p-4 text-white">
                    <h3 className="font-bold">{designTitle}</h3>
                    <p className="text-sm opacity-90">Try this design on your nails!</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">How to use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
                  <li>Click "Start Try-On" to begin</li>
                  <li>Allow camera access when prompted</li>
                  <li>Point your camera at your hand, palm facing down</li>
                  <li>Make sure your fingernails are clearly visible</li>
                  <li>Take the photo when ready</li>
                  <li>The design will be applied to your nails</li>
                </ol>
                <p className="text-xs text-gray-500 mt-2">
                  You can also upload a photo of your hand if you prefer not to use the camera.
                </p>
              </div>

              <Button className="w-full" onClick={() => setSelectedTab("camera")}>
                Start Try-On
              </Button>
            </div>
          )}

          {selectedTab === "camera" && (
            <CameraCapture onCapture={handleCapture} onCancel={() => setSelectedTab("info")} />
          )}

          {selectedTab === "result" && (
            <div className="space-y-4">
              {isProcessing ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm text-gray-500">Processing your image...</p>
                  <p className="text-xs text-gray-400 mt-2">Detecting hands and applying nail design</p>
                </div>
              ) : resultImage ? (
                <ComparisonView originalImage={capturedImage!} resultImage={resultImage} onReset={handleReset} />
              ) : (
                <div className="flex flex-col items-center py-8">
                  <p className="text-sm text-gray-500">No result available yet.</p>
                  <Button onClick={() => setSelectedTab("camera")} className="mt-4">
                    Take a Photo
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
