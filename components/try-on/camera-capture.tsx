"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RotateCcw, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CameraCaptureProps {
  videoRef?: React.RefObject<HTMLVideoElement>
  canvasRef?: React.RefObject<HTMLCanvasElement>
  onCapture: (imageSrc: string) => void
  onCancel?: () => void
}

export function CameraCapture({
  videoRef: externalVideoRef,
  canvasRef: externalCanvasRef,
  onCapture,
  onCancel,
}: CameraCaptureProps) {
  // Create internal refs if external ones aren't provided
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use external refs if provided, otherwise use internal refs
  const videoRef = externalVideoRef || internalVideoRef
  const canvasRef = externalCanvasRef || internalCanvasRef

  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    // Start camera when component mounts
    startCamera()

    // Clean up on unmount
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current
              .play()
              .then(() => setIsStreaming(true))
              .catch((err) => {
                console.error("Error playing video:", err)
                setError("Could not start video stream. Please try again.")
              })
          }
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      let errorMessage = "Could not access camera. Please check permissions."

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera access in your browser settings."
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again."
        }
      }

      setError(errorMessage)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        setError("Could not get canvas context")
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0)

      // Get the captured image as data URL
      const imageDataUrl = canvas.toDataURL("image/png")

      // Stop the camera
      stopCamera()

      // Call the onCapture callback with the image data URL
      onCapture(imageDataUrl)
    } catch (err) {
      console.error("Error capturing photo:", err)
      setError("Failed to capture photo. Please try again.")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }

      // Read the file as data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        onCapture(imageDataUrl)
      }

      reader.onerror = () => {
        setError("Failed to read the image file. Please try again.")
      }

      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error reading file:", err)
      setError("Failed to process the image file. Please try again.")
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-lg overflow-hidden mb-4">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {!isStreaming && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-2"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 w-full justify-center">
        <Button variant="outline" size="icon" onClick={onCancel || startCamera} className="rounded-full h-12 w-12">
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button onClick={capturePhoto} className="rounded-full h-12 w-12" size="icon" disabled={!isStreaming}>
          <Camera className="h-5 w-5" />
        </Button>

        <Button variant="outline" size="icon" onClick={handleFileButtonClick} className="rounded-full h-12 w-12">
          <Upload className="h-5 w-5" />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </Button>
      </div>
    </div>
  )
}
