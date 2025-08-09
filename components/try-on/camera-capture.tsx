"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RotateCcw, Upload } from "lucide-react"

interface CameraCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  onCapture: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCancel: () => void
}

export function CameraCapture({ videoRef, canvasRef, onCapture, onFileUpload, onCancel }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize camera when component mounts
  useEffect(() => {
    async function startCamera() {
      if (!videoRef.current) {
        console.error("Video ref is not available")
        setError("Camera initialization failed")
        setIsInitializing(false)
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current
              .play()
              .then(() => {
                setIsInitializing(false)
              })
              .catch((err) => {
                console.error("Error playing video:", err)
                setError("Could not start video stream")
                setIsInitializing(false)
              })
          }
        }
      } catch (err) {
        console.error("Error accessing camera:", err)
        setError("Could not access camera. Please check permissions.")
        setIsInitializing(false)
      }
    }

    startCamera()

    // Clean up on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoRef])

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-lg overflow-hidden mb-4">
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-2"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <div className="text-center p-4">
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-sm mb-4">You can still upload an image using the upload button below.</p>
            </div>
          </div>
        )}

        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-3 w-full justify-center">
        <Button variant="outline" size="icon" onClick={onCancel} className="rounded-full h-12 w-12">
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button onClick={onCapture} className="rounded-full h-12 w-12" size="icon" disabled={isInitializing || !!error}>
          <Camera className="h-5 w-5" />
        </Button>

        <Button variant="outline" size="icon" onClick={handleFileButtonClick} className="rounded-full h-12 w-12">
          <Upload className="h-5 w-5" />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileUpload} />
        </Button>
      </div>
    </div>
  )
}
