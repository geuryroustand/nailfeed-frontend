"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Camera, Hand, ImageIcon } from "lucide-react"
import { CameraCapture } from "./camera-capture"
import { ComparisonView } from "./comparison-view"
import { useTryOn } from "@/hooks/use-try-on"
import { initMediaPipe } from "@/lib/try-on-utils"

interface TryOnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  designImageUrl: string
  designTitle?: string
}

export function TryOnModal({ open, onOpenChange, designImageUrl, designTitle = "Nail Design" }: TryOnModalProps) {
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
  const [loadingStatus, setLoadingStatus] = useState<string>("Initializing...")

  // Initialize MediaPipe when the modal opens
  useEffect(() => {
    if (open) {
      const init = async () => {
        setLoadingStatus("Loading hand tracking model...")
        try {
          await initMediaPipe()
          setLoadingStatus("Ready!")
          // Auto-switch to camera tab after initialization
          setTimeout(() => {
            setSelectedTab("camera")
            // Add a small delay before starting capture to ensure DOM is ready
            setTimeout(() => {
              if (videoRef.current) {
                startCapture()
              } else {
                console.error("Video ref is not available when trying to start capture")
                setLoadingStatus("Error: Camera element not ready. Please try again.")
              }
            }, 300)
          }, 1000)
        } catch (err) {
          console.error("MediaPipe initialization error:", err)
          setLoadingStatus("Failed to load hand tracking model")
        }
      }

      init()
      setSelectedTab("info") // Reset to info tab when opening
    }
  }, [open, startCapture])

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
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Try On: {designTitle}</DialogTitle>
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
            onClick={() => {
              setSelectedTab("camera")
              if (state === "idle") startCapture()
            }}
            disabled={state === "processing"}
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
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <img
                  src={designImageUrl || "/placeholder.svg"}
                  alt={designTitle}
                  className="w-full h-full object-contain"
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
                  <li>Go to the Camera tab</li>
                  <li>Point your camera at your hand, palm facing down</li>
                  <li>Make sure your fingernails are clearly visible</li>
                  <li>Take the photo when ready</li>
                  <li>The design will be applied to your nails</li>
                </ol>
                <p className="text-xs text-gray-500 mt-2">Status: {loadingStatus}</p>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setSelectedTab("camera")
                  startCapture()
                }}
              >
                Start Try-On
              </Button>
            </div>
          )}

          {selectedTab === "camera" && state === "capturing" && (
            <CameraCapture
              videoRef={videoRef}
              canvasRef={canvasRef}
              onCapture={capturePhoto}
              onFileUpload={handleFileUpload}
              onCancel={() => onOpenChange(false)}
            />
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
