"use client"

import { useEffect, useState } from "react"
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

  const {
    state,
    capturedImage,
    resultImage,
    error,
    videoRef,
    canvasRef,
    startCapture,
    capturePhoto,
    handleFileUpload,
    reset,
  } = useTryOn(designImageUrl)

  const [selectedTab, setSelectedTab] = useState<"info" | "camera" | "result">("info")
  const [isInitializing, setIsInitializing] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  // Update selected tab based on state
  useEffect(() => {
    if (state === "capturing") {
      setSelectedTab("camera")
    } else if (state === "result") {
      setSelectedTab("result")
    }
  }, [state])

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      reset()
      setSelectedTab("info")
      setIsInitializing(false)
      setInitializationError(null)
    }
  }, [open, reset])

  const handleStartTryOn = async () => {
    setIsInitializing(true)
    setInitializationError(null)
    setSelectedTab("camera")

    try {
      await startCapture()
    } catch (err) {
      console.error("Error starting capture:", err)
      setInitializationError("Failed to initialize camera. Please try again or use the file upload option.")
    } finally {
      setIsInitializing(false)
    }
  }

  const handleCameraTabClick = async () => {
    if (state === "idle") {
      setIsInitializing(true)
      setInitializationError(null)

      try {
        await startCapture()
      } catch (err) {
        console.error("Error starting capture:", err)
        setInitializationError("Failed to initialize camera. Please try again or use the file upload option.")
      } finally {
        setIsInitializing(false)
      }
    }
    setSelectedTab("camera")
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
            onClick={handleCameraTabClick}
            disabled={state === "processing" || isInitializing}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
          <Button
            variant={selectedTab === "result" ? "default" : "ghost"}
            className="flex-1 rounded-none rounded-t-lg"
            onClick={() => setSelectedTab("result")}
            disabled={state !== "result"}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Result
          </Button>
        </div>

        {/* Error alerts */}
        {(error || initializationError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || initializationError}</AlertDescription>
          </Alert>
        )}

        {/* Tab content */}
        <div className="py-2">
          {selectedTab === "info" && (
            <div className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={designImageUrl || "/placeholder.svg"}
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

              <Button className="w-full" onClick={handleStartTryOn} disabled={isInitializing}>
                {isInitializing ? "Initializing..." : "Start Try-On"}
              </Button>
            </div>
          )}

          {selectedTab === "camera" && (
            <>
              {isInitializing && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm text-gray-500">Initializing camera and hand tracking...</p>
                </div>
              )}

              {state === "capturing" && (
                <CameraCapture
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  onCapture={capturePhoto}
                  onFileUpload={handleFileUpload}
                  onCancel={() => onOpenChange(false)}
                />
              )}

              {state === "idle" && !isInitializing && (
                <div className="flex flex-col items-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-4">Camera not started</p>
                  <div className="flex gap-2">
                    <Button onClick={handleStartTryOn}>Start Camera</Button>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      <div className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">Upload Photo</div>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {state === "processing" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-500">Processing your image...</p>
              <p className="text-xs text-gray-400 mt-2">Detecting hands and applying nail design</p>
            </div>
          )}

          {selectedTab === "result" && state === "result" && capturedImage && resultImage && (
            <ComparisonView originalImage={capturedImage} resultImage={resultImage} onReset={reset} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
