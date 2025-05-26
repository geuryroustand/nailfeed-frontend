"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CameraCapture } from "./camera-capture"
import { ComparisonView } from "./comparison-view"
import { useTryOn } from "@/hooks/use-try-on"
import { initMediaPipe } from "@/lib/try-on-utils"
import { Loader2 } from "lucide-react"

interface TryOnModalProps {
  isOpen: boolean
  onClose: () => void
  designImageUrl: string
  designName: string
}

export function TryOnModal({ isOpen, onClose, designImageUrl, designName }: TryOnModalProps) {
  const {
    state,
    error,
    videoRef,
    canvasRef,
    startCapture,
    capturePhoto,
    handleFileUpload,
    reset,
    capturedImage,
    resultImage,
  } = useTryOn(designImageUrl)

  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    if (isOpen) {
      // Initialize MediaPipe when the modal opens
      const init = async () => {
        setIsInitializing(true)
        await initMediaPipe()
        setIsInitializing(false)
      }
      init()

      // Start camera capture if not in result state
      if (state === "idle") {
        startCapture()
      }
    } else {
      // Reset when modal closes
      reset()
    }
  }, [isOpen, reset, startCapture, state])

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Try On: {designName}</DialogTitle>
          <DialogDescription>
            Capture a photo of your hand or upload an image to see how this nail design looks on you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4">
          {isInitializing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Initializing camera...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          ) : state === "capturing" ? (
            <CameraCapture
              videoRef={videoRef}
              canvasRef={canvasRef}
              onCapture={capturePhoto}
              onFileUpload={handleFileUpload}
              onCancel={handleClose}
            />
          ) : state === "processing" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Processing your image...</p>
            </div>
          ) : state === "result" && capturedImage && resultImage ? (
            <ComparisonView originalImage={capturedImage} resultImage={resultImage} onReset={reset} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-sm text-muted-foreground mb-4">Something went wrong. Please try again.</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
