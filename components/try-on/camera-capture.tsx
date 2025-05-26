"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X } from "lucide-react"

interface CameraCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  onCapture: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCancel: () => void
}

export function CameraCapture({ videoRef, canvasRef, onCapture, onFileUpload, onCancel }: CameraCaptureProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if video is ready
  useEffect(() => {
    const checkVideoReady = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        setIsVideoReady(true)
      }
    }

    const video = videoRef.current
    if (video) {
      video.addEventListener("loadeddata", checkVideoReady)
      // Also check immediately in case it's already loaded
      checkVideoReady()
    }

    return () => {
      if (video) {
        video.removeEventListener("loadeddata", checkVideoReady)
      }
    }
  }, [videoRef])

  // Handle countdown
  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      onCapture()
      setCountdown(null)
    }
  }, [countdown, onCapture])

  const startCountdown = () => {
    setCountdown(3)
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  // Add hand position guidance overlay
  const handGuidance = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
        <div className="text-white text-center bg-black/40 p-2 rounded">
          <p>Position your hand here</p>
          <p className="text-xs">Palm down, fingers spread</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Video feed */}
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />

        {/* Canvas for capturing (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hand position guidance */}
        {isVideoReady && handGuidance}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <div className="text-6xl font-bold">{countdown}</div>
          </div>
        )}

        {/* Camera not ready message */}
        {!isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
            <div className="text-center">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={triggerFileUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button variant="default" size="sm" onClick={startCountdown} disabled={!isVideoReady || countdown !== null}>
            <Camera className="h-4 w-4 mr-2" />
            {countdown !== null ? `Capturing in ${countdown}...` : "Capture"}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileUpload} />
    </div>
  )
}
