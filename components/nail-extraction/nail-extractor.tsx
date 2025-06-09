"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Upload, Wand2, XCircle, CheckCircle } from "lucide-react"
import {
  initMediaPipeHands,
  processImageWithMediaPipe,
  extractAllHandLandmarksPixelCoords,
} from "@/lib/mediapipe-hand-utils"

interface PixelCoordinate {
  id: number
  x: number
  y: number
}

interface ImageDimensions {
  naturalWidth: number
  naturalHeight: number
}

interface CroppedNail {
  id: string // e.g., "thumb", "index"
  dataUrl: string
  boundingBox: { x: number; y: number; width: number; height: number }
}

// Landmark indices for MediaPipe Hands
const NAIL_LANDMARK_SETS: Record<string, number[]> = {
  thumb: [2, 3, 4], // THUMB_MCP, THUMB_IP, THUMB_TIP
  index: [6, 7, 8], // INDEX_FINGER_PIP, INDEX_FINGER_DIP, INDEX_FINGER_TIP
  middle: [10, 11, 12], // MIDDLE_FINGER_PIP, MIDDLE_FINGER_DIP, MIDDLE_FINGER_TIP
  ring: [14, 15, 16], // RING_FINGER_PIP, RING_FINGER_DIP, RING_FINGER_TIP
  pinky: [18, 19, 20], // PINKY_PIP, PINKY_FINGER_DIP, PINKY_TIP
}

const FINGERTIP_INDICES = [4, 8, 12, 16, 20]

const NailExtractor: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [allHandLandmarks, setAllHandLandmarks] = useState<PixelCoordinate[][]>([])
  const [croppedNails, setCroppedNails] = useState<CroppedNail[]>([])
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null)
  const [mediaPipeHands, setMediaPipeHands] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null) // For displaying image + landmarks
  const fileInputRef = useRef<HTMLInputElement>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas")) // For processing

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string)
        setAllHandLandmarks([])
        setCroppedNails([])
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const drawLandmarks = useCallback(
    (landmarksToDraw: PixelCoordinate[], ctx: CanvasRenderingContext2D, color = "red", pointRadius = 5) => {
      landmarksToDraw.forEach((lm) => {
        ctx.beginPath()
        ctx.arc(lm.x, lm.y, pointRadius, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
      })
    },
    [],
  )

  const drawBoundingBox = useCallback(
    (ctx: CanvasRenderingContext2D, box: { x: number; y: number; width: number; height: number }, color = "lime") => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.strokeRect(box.x, box.y, box.width, box.height)
    },
    [],
  )

  const runDetectionAndCropping = useCallback(
    async (imageElement: HTMLImageElement) => {
      if (!mediaPipeHands) {
        setError("Hand detection model not ready.")
        return
      }
      if (!imageElement.complete || imageElement.naturalWidth === 0) {
        console.warn("Image not fully loaded for detection.")
        return
      }

      setIsLoading(true)
      setError(null)
      setAllHandLandmarks([])
      setCroppedNails([])

      const naturalWidth = imageElement.naturalWidth
      const naturalHeight = imageElement.naturalHeight
      setImageDimensions({ naturalWidth, naturalHeight })

      // Prepare display canvas
      if (canvasRef.current) {
        const displayCtx = canvasRef.current.getContext("2d")
        if (displayCtx) {
          canvasRef.current.width = naturalWidth
          canvasRef.current.height = naturalHeight
          displayCtx.drawImage(imageElement, 0, 0, naturalWidth, naturalHeight)
        }
      }

      // Use offscreen canvas for MediaPipe processing
      const processCanvas = offscreenCanvasRef.current
      processCanvas.width = naturalWidth
      processCanvas.height = naturalHeight
      const processCtx = processCanvas.getContext("2d")
      if (!processCtx) {
        setError("Could not get offscreen canvas context.")
        setIsLoading(false)
        return
      }
      processCtx.drawImage(imageElement, 0, 0, naturalWidth, naturalHeight)

      try {
        const results = await processImageWithMediaPipe(processCanvas, mediaPipeHands)
        const detectedHandsLandmarks = extractAllHandLandmarksPixelCoords(results, naturalWidth, naturalHeight)
        setAllHandLandmarks(detectedHandsLandmarks)

        if (detectedHandsLandmarks.length === 0) {
          setError("No hand detected. Try a different image or angle.")
          setIsLoading(false)
          return
        }

        // Assuming one hand for simplicity
        const hand = detectedHandsLandmarks[0]

        // Draw all landmarks on display canvas
        const displayCtx = canvasRef.current?.getContext("2d")
        if (displayCtx) {
          // Draw all landmarks
          drawLandmarks(hand, displayCtx, "rgba(0, 255, 0, 0.7)", 3)
          // Highlight fingertips
          const fingertips = hand.filter((lm) => FINGERTIP_INDICES.includes(lm.id))
          drawLandmarks(fingertips, displayCtx, "rgba(255, 0, 0, 1)", 5)
        }

        const newCroppedNails: CroppedNail[] = []
        for (const [nailName, landmarkIndices] of Object.entries(NAIL_LANDMARK_SETS)) {
          const nailSpecificLandmarks = landmarkIndices.map((index) => hand[index]).filter(Boolean)

          if (nailSpecificLandmarks.length < 2) {
            // Need at least 2 points to define a region
            console.warn(`Not enough landmarks for ${nailName} nail.`)
            continue
          }

          const xs = nailSpecificLandmarks.map((lm) => lm.x)
          const ys = nailSpecificLandmarks.map((lm) => lm.y)
          let minX = Math.min(...xs)
          let maxX = Math.max(...xs)
          let minY = Math.min(...ys)
          let maxY = Math.max(...ys)

          // Calculate width and height from landmarks
          const boxWidth = maxX - minX
          const boxHeight = maxY - minY

          // Add padding (e.g., 20% of the dimension, or a fixed pixel value)
          // More sophisticated padding might be needed depending on nail orientation
          const paddingX = boxWidth * 0.3
          const paddingY = boxHeight * 0.5

          minX = Math.max(0, minX - paddingX)
          maxX = Math.min(naturalWidth, maxX + paddingX)
          minY = Math.max(0, minY - paddingY) // More padding above the tip
          maxY = Math.min(naturalHeight, maxY + paddingY * 0.5) // Less padding below

          const finalBox = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          }

          if (finalBox.width <= 0 || finalBox.height <= 0) {
            console.warn(`Invalid bounding box for ${nailName} nail.`)
            continue
          }

          // Draw bounding box on display canvas
          if (displayCtx) {
            drawBoundingBox(displayCtx, finalBox)
          }

          // Crop using the offscreen canvas (which has the original image)
          const cropCanvas = document.createElement("canvas")
          cropCanvas.width = finalBox.width
          cropCanvas.height = finalBox.height
          const cropCtx = cropCanvas.getContext("2d")
          if (cropCtx) {
            cropCtx.drawImage(
              processCanvas, // Source canvas with original image
              finalBox.x,
              finalBox.y,
              finalBox.width,
              finalBox.height, // Source rect
              0,
              0,
              finalBox.width,
              finalBox.height, // Destination rect
            )
            newCroppedNails.push({
              id: nailName,
              dataUrl: cropCanvas.toDataURL("image/png"),
              boundingBox: finalBox,
            })
          }
        }
        setCroppedNails(newCroppedNails)
        if (newCroppedNails.length === 0 && detectedHandsLandmarks.length > 0) {
          setError("Hand detected, but could not extract nail regions. Landmarks might be too close or out of bounds.")
        }
      } catch (err) {
        console.error("Error during hand detection or cropping:", err)
        setError(`Processing failed: ${(err as Error).message}`)
      } finally {
        setIsLoading(false)
      }
    },
    [mediaPipeHands, drawLandmarks, drawBoundingBox],
  )

  useEffect(() => {
    if (imageSrc && imageRef.current) {
      const img = imageRef.current
      const handleImageLoad = () => {
        runDetectionAndCropping(img)
      }
      if (img.complete && img.naturalWidth > 0) {
        handleImageLoad()
      } else {
        img.onload = handleImageLoad
        img.onerror = () => setError("Failed to load image for processing.")
      }
      return () => {
        img.onload = null
        img.onerror = null
      }
    }
  }, [imageSrc, runDetectionAndCropping])

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center text-pink-600">Nail Design Extractor</h1>

      <div className="flex justify-center">
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="lg">
          <Upload className="mr-2 h-5 w-5" /> Upload Post Image
        </Button>
        <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
      </div>

      {isLoading && (
        <Alert>
          <Loader2 className="h-5 w-5 animate-spin" />
          <AlertTitle>Processing Image...</AlertTitle>
          <AlertDescription>
            {mediaPipeHands ? "Detecting hand and extracting nails..." : "Initializing detection model..."}
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

      {!isLoading && imageSrc && allHandLandmarks.length > 0 && croppedNails.length === 0 && !error && (
        <Alert variant="warning">
          <Wand2 className="h-5 w-5" />
          <AlertTitle>Detection Incomplete</AlertTitle>
          <AlertDescription>
            Hand landmarks were detected, but no nail regions could be extracted. The hand might be at an unusual angle
            or too small.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && imageSrc && croppedNails.length > 0 && !error && (
        <Alert variant="default" className="border-green-500 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-700">Extraction Successful!</AlertTitle>
          <AlertDescription>
            {croppedNails.length} nail designs extracted. Fingertips are marked in red, other landmarks in green, and
            bounding boxes in lime.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {imageSrc && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Original Image with Detections</h2>
            <div className="border rounded-md overflow-hidden flex justify-center bg-gray-50">
              {/* Hidden img tag for loading and getting dimensions */}
              <img
                ref={imageRef}
                src={imageSrc || "/placeholder.svg"}
                alt="Uploaded hand for processing"
                className="hidden"
              />
              {/* Canvas for displaying image and drawings */}
              <canvas ref={canvasRef} className="max-w-full h-auto max-h-[60vh]" />
            </div>
          </div>
        )}

        {croppedNails.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Extracted Nail Designs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {croppedNails.map((nail) => (
                <div key={nail.id} className="border rounded-md p-2 shadow-sm bg-white">
                  <p className="text-sm font-medium capitalize text-center mb-1">{nail.id} Nail</p>
                  <img
                    src={nail.dataUrl || "/placeholder.svg"}
                    alt={`Cropped ${nail.id} nail`}
                    className="w-full h-auto object-contain rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NailExtractor
