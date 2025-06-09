"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Upload, Camera, XCircle, CheckCircle, Wand2 } from "lucide-react"
import { initMediaPipeHands, processImageWithMediaPipe, extractFingertipPixelCoords } from "@/lib/mediapipe-hand-utils"
import LandmarkPoint from "./landmark-point"

interface Landmark {
  id: number
  x: number
  y: number
}

interface ImageDimensions {
  naturalWidth: number
  naturalHeight: number
  displayWidth: number
  displayHeight: number
}

const HandDetector: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null)
  const [mediaPipeHands, setMediaPipeHands] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas")) // Offscreen canvas

  // Initialize MediaPipe
  useEffect(() => {
    async function initializeMediaPipe() {
      try {
        setIsLoading(true)
        setError(null)
        const hands = await initMediaPipeHands()
        setMediaPipeHands(hands)
      } catch (err) {
        console.error("Failed to initialize MediaPipe:", err)
        setError(`Failed to initialize hand detection model: ${(err as Error).message}`)
      } finally {
        setIsLoading(false)
      }
    }
    initializeMediaPipe()
  }, [])

  const stopCameraStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsCameraActive(false)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [stream])

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCameraStream()
    }
  }, [stopCameraStream])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    stopCameraStream()
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string)
        setLandmarks([]) // Clear previous landmarks
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    stopCameraStream() // Stop any existing stream
    setImageSrc(null) // Clear any uploaded image
    setLandmarks([])
    setError(null)
    try {
      setIsLoading(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Video play failed:", err)
            setError("Could not start camera preview.")
          })
        }
      }
      setIsCameraActive(true)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Could not access camera. Please check permissions.")
    } finally {
      setIsLoading(false)
    }
  }

  const captureImageFromVideo = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
      const dataUrl = canvas.toDataURL("image/png")
      setImageSrc(dataUrl)
      stopCameraStream()
    }
  }

  const runDetection = useCallback(
    async (imageElement: HTMLImageElement) => {
      if (!mediaPipeHands) {
        setError("Hand detection model not ready.")
        return
      }
      if (!imageElement.complete || imageElement.naturalWidth === 0) {
        // Image might not be fully loaded yet, especially if src was just set
        console.warn("Image not fully loaded for detection, will retry or wait for onload.")
        return
      }

      setIsLoading(true)
      setError(null)
      setLandmarks([])

      try {
        // Use the offscreen canvas for processing
        const processCanvas = canvasRef.current
        processCanvas.width = imageElement.naturalWidth
        processCanvas.height = imageElement.naturalHeight
        const ctx = processCanvas.getContext("2d")
        if (!ctx) {
          throw new Error("Could not get canvas context for processing.")
        }
        ctx.drawImage(imageElement, 0, 0, imageElement.naturalWidth, imageElement.naturalHeight)

        const results = await processImageWithMediaPipe(processCanvas, mediaPipeHands)
        const detected = extractFingertipPixelCoords(results, imageElement.naturalWidth, imageElement.naturalHeight)

        if (detected.length === 0) {
          setError("No hand detected or landmarks could not be extracted. Try a different image or angle.")
        }
        setLandmarks(detected)
      } catch (err) {
        console.error("Error during hand detection:", err)
        setError(`Detection failed: ${(err as Error).message}`)
      } finally {
        setIsLoading(false)
      }
    },
    [mediaPipeHands],
  )

  // Effect to run detection when imageSrc changes and image is loaded
  useEffect(() => {
    if (imageSrc && imageRef.current) {
      const img = imageRef.current
      const handleImageLoad = () => {
        setImageDimensions({
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: img.offsetWidth,
          displayHeight: img.offsetHeight,
        })
        runDetection(img)
      }

      if (img.complete && img.naturalWidth > 0) {
        // Image already loaded
        handleImageLoad()
      } else {
        img.onload = handleImageLoad
        img.onerror = () => setError("Failed to load image for detection.")
      }
      // Cleanup onload handler
      return () => {
        img.onload = null
        img.onerror = null
      }
    }
  }, [imageSrc, runDetection])

  // Update display dimensions if window resizes (for responsive images)
  useEffect(() => {
    const updateDisplayDim = () => {
      if (imageRef.current && imageDimensions) {
        setImageDimensions((prev) =>
          prev
            ? {
                ...prev,
                displayWidth: imageRef.current!.offsetWidth,
                displayHeight: imageRef.current!.offsetHeight,
              }
            : null,
        )
      }
    }
    window.addEventListener("resize", updateDisplayDim)
    return () => window.removeEventListener("resize", updateDisplayDim)
  }, [imageDimensions])

  const handleLandmarkPositionChange = (id: number, newDisplayX: number, newDisplayY: number) => {
    if (!imageDimensions) return

    const { naturalWidth, naturalHeight, displayWidth, displayHeight } = imageDimensions

    // Convert display coordinates back to natural image coordinates
    const scaleX = naturalWidth / displayWidth
    const scaleY = naturalHeight / displayHeight

    const newNaturalX = newDisplayX * scaleX
    const newNaturalY = newDisplayY * scaleY

    setLandmarks((prevLandmarks) =>
      prevLandmarks.map((lm) => (lm.id === id ? { ...lm, x: newNaturalX, y: newNaturalY } : lm)),
    )
  }

  const displayScale =
    imageDimensions && imageDimensions.displayWidth > 0
      ? imageDimensions.displayWidth / imageDimensions.naturalWidth
      : 1

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Hand Landmark Detection</h1>

      <div className="space-y-2">
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" /> Upload Image
        </Button>
        <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        {isCameraActive ? (
          <div className="space-y-2">
            <Button onClick={captureImageFromVideo} className="w-full">
              <Camera className="mr-2 h-4 w-4" /> Capture Photo
            </Button>
            <Button onClick={stopCameraStream} variant="destructive" className="w-full">
              <XCircle className="mr-2 h-4 w-4" /> Stop Camera
            </Button>
          </div>
        ) : (
          <Button onClick={startCamera} className="w-full">
            <Camera className="mr-2 h-4 w-4" /> Start Camera
          </Button>
        )}
      </div>

      {isLoading && (
        <Alert>
          <Loader2 className="h-5 w-5 animate-spin" />
          <AlertTitle>Processing...</AlertTitle>
          <AlertDescription>
            {mediaPipeHands ? "Detecting hand landmarks..." : "Initializing detection model..."}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && imageSrc && landmarks.length > 0 && !error && (
        <Alert variant="default" className="border-green-500">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-700">Detection Successful</AlertTitle>
          <AlertDescription>
            {landmarks.length} fingertip landmarks detected. You can drag the points to adjust their positions.
          </AlertDescription>
        </Alert>
      )}
      {!isLoading && imageSrc && landmarks.length === 0 && !error && (
        <Alert variant="destructive">
          <Wand2 className="h-5 w-5" />
          <AlertTitle>No Landmarks Detected</AlertTitle>
          <AlertDescription>
            Could not detect hand landmarks in the provided image. Please try a different image or ensure the hand is
            clearly visible.
          </AlertDescription>
        </Alert>
      )}

      <div
        ref={imageContainerRef}
        className="relative w-full border rounded-md overflow-hidden bg-gray-100 min-h-[200px]"
      >
        {isCameraActive && !imageSrc && (
          <video
            ref={videoRef}
            className="w-full h-auto block"
            playsInline
            muted
            autoPlay
            style={{ maxHeight: "70vh" }}
          />
        )}
        {imageSrc && (
          <img
            ref={imageRef}
            src={imageSrc || "/placeholder.svg"}
            alt="Uploaded or captured hand"
            className="w-full h-auto block"
            style={{ maxHeight: "70vh" }}
            // onLoad event is handled in useEffect to trigger detection
          />
        )}
        {imageDimensions &&
          landmarks.map((lm) => (
            <LandmarkPoint
              key={lm.id}
              id={lm.id}
              initialX={lm.x * displayScale}
              initialY={lm.y * displayScale}
              onPositionChange={handleLandmarkPositionChange}
              containerRef={imageContainerRef}
              color={
                lm.id === 4 ? "blue" : lm.id === 8 ? "green" : lm.id === 12 ? "yellow" : lm.id === 16 ? "purple" : "red"
              }
              pointSize={10 / displayScale > 5 ? 10 : 5 * displayScale} // Adjust point size based on scale
            />
          ))}
      </div>

      {landmarks.length > 0 && imageDimensions && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">
            Adjusted Landmark Coordinates (Natural Image Scale):
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            {landmarks.map((lm) => (
              <li key={lm.id} className="font-mono">
                Landmark {lm.id}: (X: {lm.x.toFixed(2)}, Y: {lm.y.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default HandDetector
