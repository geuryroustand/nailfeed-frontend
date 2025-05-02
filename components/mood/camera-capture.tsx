"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X, RotateCcw, Check, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import Cropper from "react-easy-crop"
import getCroppedImg from "@/lib/crop-image"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [error, setError] = useState<string | null>(null)
  const [isTorchOn, setIsTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropping, setIsCropping] = useState(false)

  // Initialize camera
  useEffect(() => {
    async function setupCamera() {
      try {
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            torch: isTorchOn, // Initial torch setting
          },
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(mediaStream)

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }

        // Check if torch is supported
        const track = mediaStream.getVideoTracks()[0]
        const imageCapture = new ImageCapture(track)
        const photoCapabilities = await imageCapture.getPhotoCapabilities()
        setTorchSupported(photoCapabilities.fillLightMode?.includes("torch") || false)

        setError(null)
      } catch (err: any) {
        console.error("Error accessing camera:", err)
        setError("Could not access camera. Please ensure you've granted camera permissions.")
      }
    }

    setupCamera()

    // Cleanup function to stop the camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode, isTorchOn])

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!canvas) {
        console.error("Canvas element not found!")
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        console.error("Could not get canvas context!")
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL("image/jpeg")
      setCapturedImage(dataUrl)
      setIsCropping(true)
      setCrop({ x: 0, y: 0 }) // Reset crop when new image is captured
      setZoom(1) // Reset zoom when new image is captured
    }
  }

  const switchCamera = () => {
    // Stop current stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    // Toggle facing mode
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"))
  }

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixelsLocal: any) => {
    setCroppedAreaPixels(croppedAreaPixelsLocal)
    console.log("Crop complete", croppedArea, croppedAreaPixelsLocal)
  }, [])

  const confirmPhoto = useCallback(async () => {
    if (capturedImage && croppedAreaPixels) {
      try {
        setIsCropping(false)
        const croppedImage = await getCroppedImg(capturedImage, croppedAreaPixels)
        onCapture(croppedImage)
      } catch (error) {
        console.error("Error cropping image:", error)
      }
    }
  }, [capturedImage, croppedAreaPixels, onCapture])

  const retakePhoto = () => {
    setCapturedImage(null)
    setIsCropping(false)
  }

  const toggleTorch = () => {
    setIsTorchOn(!isTorchOn)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black text-white">
        <h2 className="text-lg font-semibold">Take a Photo</h2>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-white">
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        {error ? (
          <div className="text-white text-center p-4">
            <p>{error}</p>
            <Button className="mt-4 bg-gradient-to-r from-pink-500 to-purple-500" onClick={onCancel}>
              Go Back
            </Button>
          </div>
        ) : capturedImage && isCropping ? (
          <div className="relative" style={{ width: "100%", height: "100%" }}>
            <Cropper
              image={capturedImage}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage || "/placeholder.svg"}
            alt="Captured"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="max-h-full max-w-full object-contain" />
        )}

        {/* Hidden canvas for capturing frames */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-4 bg-black flex justify-center gap-4">
        {capturedImage && isCropping ? (
          <>
            <Button
              variant="outline"
              className="rounded-full h-14 w-14 flex items-center justify-center border-white text-white"
              onClick={retakePhoto}
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
            <Button
              className="rounded-full h-14 w-14 flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-500"
              onClick={confirmPhoto}
            >
              <Check className="h-6 w-6" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="rounded-full h-14 w-14 flex items-center justify-center border-white text-white"
              onClick={switchCamera}
            >
              <Camera className="h-6 w-6" />
            </Button>
            <Button
              className="rounded-full h-14 w-14 flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-500"
              onClick={capturePhoto}
            >
              <span className="sr-only">Capture</span>
              <div className="h-12 w-12 rounded-full border-4 border-white"></div>
            </Button>
            {torchSupported && (
              <Button
                variant="outline"
                className={cn(
                  "rounded-full h-14 w-14 flex items-center justify-center border-white text-white",
                  isTorchOn && "bg-white text-black",
                )}
                onClick={toggleTorch}
              >
                <Zap className="h-6 w-6" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
