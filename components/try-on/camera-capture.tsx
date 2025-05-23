"use client"

import type React from "react"

import { useRef, useEffect } from "react"
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

  useEffect(() => {
    // Ensure video plays when loaded
    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.onloadedmetadata = () => {
        videoElement.play()
      }
    }

    // Clean up on unmount
    return () => {
      const stream = videoElement?.srcObject as MediaStream
      if (stream) {
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
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-3 w-full justify-center">
        <Button variant="outline" size="icon" onClick={onCancel} className="rounded-full h-12 w-12">
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button onClick={onCapture} className="rounded-full h-12 w-12" size="icon">
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
