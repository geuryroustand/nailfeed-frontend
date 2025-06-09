"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Upload, XCircle, CheckCircle } from "lucide-react"
import {
  initMediaPipeHands,
  processImageWithMediaPipe,
  extractAllHandLandmarksPixelCoords,
} from "@/lib/mediapipe-hand-utils"
import removeBackground from "@imgly/background-removal"

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
  originalDataUrl: string
  processedDataUrl: string | null
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
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null) // For displaying image + landmarks
  const fileInputRef = useRef<HTMLInputElement>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas")) // For processing

  useEffect(() => {
    async function initializeMediaPipe() {
      try {
        setLoadingMessage("Initializing detection model...")
        setIsLoading(true)
        setError(null)
        const hands = await initMediaPipeHands()
        setMediaPipeHands(hands)
      } catch (err) {
        console.error("Failed to initialize MediaPipe:", err)
        setError(`Failed to initialize hand detection model: ${(err as Error).message}`)
      } finally {
        setIsLoading(false)
        setLoadingMessage("")
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
      setLoadingMessage("Detecting hand and cropping nails...")
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

        const hand = detectedHandsLandmarks[0]
        const displayCtx = canvasRef.current?.getContext("2d")
        if (displayCtx) {
          drawLandmarks(hand, displayCtx, "rgba(0, 255, 0, 0.7)", 3)
          const fingertips = hand.filter((lm) => FINGERTIP_INDICES.includes(lm.id))
          drawLandmarks(fingertips, displayCtx, "rgba(255, 0, 0, 1)", 5)
        }

        const initialCrops: Omit<CroppedNail, "processedDataUrl">[] = []
        for (const [nailName, landmarkIndices] of Object.entries(NAIL_LANDMARK_SETS)) {
          const nailSpecificLandmarks = landmarkIndices.map((index) => hand[index]).filter(Boolean)
          if (nailSpecificLandmarks.length < 2) continue

          const xs = nailSpecificLandmarks.map((lm) => lm.x)
          const ys = nailSpecificLandmarks.map((lm) => lm.y)
          let minX = Math.min(...xs),
            maxX = Math.max(...xs),
            minY = Math.min(...ys),
            maxY = Math.max(...ys)
          const boxWidth = maxX - minX,
            boxHeight = maxY - minY
          const paddingX = boxWidth * 0.3,
            paddingY = boxHeight * 0.5
          minX = Math.max(0, minX - paddingX)
          maxX = Math.min(naturalWidth, maxX + paddingX)
          minY = Math.max(0, minY - paddingY)
          maxY = Math.min(naturalHeight, maxY + paddingY * 0.5)
          const finalBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }

          if (finalBox.width <= 0 || finalBox.height <= 0) continue

          if (displayCtx) drawBoundingBox(displayCtx, finalBox)

          const cropCanvas = document.createElement("canvas")
          cropCanvas.width = finalBox.width
          cropCanvas.height = finalBox.height
          const cropCtx = cropCanvas.getContext("2d")
          if (cropCtx) {
            cropCtx.drawImage(
              processCanvas,
              finalBox.x,
              finalBox.y,
              finalBox.width,
              finalBox.height,
              0,
              0,
              finalBox.width,
              finalBox.height,
            )
            initialCrops.push({
              id: nailName,
              originalDataUrl: cropCanvas.toDataURL("image/png"),
              boundingBox: finalBox,
            })
          }
        }

        if (initialCrops.length === 0) {
          setError("Hand detected, but could not extract nail regions.")
          setIsLoading(false)
          return
        }

        setLoadingMessage("Removing background from nail designs...")

        const backgroundRemovalPromises = initialCrops.map(async (crop) => {
          try {
            const blob = await removeBackground(crop.originalDataUrl)
            const processedDataUrl = URL.createObjectURL(blob)
            return { ...crop, processedDataUrl }
          } catch (e) {
            console.error(`Background removal failed for ${crop.id}:`, e)
            return { ...crop, processedDataUrl: null } // Keep original if removal fails
          }
        })

        const finalCrops = await Promise.all(backgroundRemovalPromises)
        setCroppedNails(finalCrops)
      } catch (err) {
        console.error("Error during hand detection or cropping:", err)
        setError(`Processing failed: ${(err as Error).message}`)
      } finally {
        setIsLoading(false)
        setLoadingMessage("")
      }
    },
    [mediaPipeHands, drawLandmarks, drawBoundingBox],
  )

  useEffect(() => {
    if (imageSrc && imageRef.current) {
      const img = imageRef.current
      const handleImageLoad = () => runDetectionAndCropping(img)
      if (img.complete && img.naturalWidth > 0) handleImageLoad()
      else {
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
    <div className="p-4 max-w-5xl mx-auto space-y-6">
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
          <AlertDescription>{loadingMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && imageSrc && croppedNails.length > 0 && !error && (
        <Alert variant="default" className="border-green-500 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-700">Extraction Successful!</AlertTitle>
          <AlertDescription>{croppedNails.length} nail designs extracted and processed.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-8">
        {imageSrc && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Original Image with Detections</h2>
            <div className="border rounded-md overflow-hidden flex justify-center bg-gray-100">
              <img
                ref={imageRef}
                src={imageSrc || "/placeholder.svg"}
                alt="Uploaded hand for processing"
                className="hidden"
              />
              <canvas ref={canvasRef} className="max-w-full h-auto max-h-[60vh]" />
            </div>
          </div>
        )}

        {croppedNails.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Extracted & Processed Nail Designs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {croppedNails.map((nail) => (
                <div key={nail.id} className="border rounded-lg p-3 shadow-md bg-white space-y-3">
                  <h3 className="text-lg font-medium capitalize text-center">{nail.id} Nail</h3>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <p className="text-xs font-semibold text-center mb-1 text-gray-600">Original Crop</p>
                      <div className="bg-gray-200 rounded">
                        <img
                          src={nail.originalDataUrl || "/placeholder.svg"}
                          alt={`Original crop of ${nail.id} nail`}
                          className="w-full h-auto object-contain rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-center mb-1 text-pink-600">Final Design</p>
                      <div className="bg-grid-pattern rounded">
                        {nail.processedDataUrl ? (
                          <img
                            src={nail.processedDataUrl || "/placeholder.svg"}
                            alt={`Processed ${nail.id} nail with transparent background`}
                            className="w-full h-auto object-contain rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-xs text-red-500 p-2">
                            BG removal failed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  )
}

export default NailExtractor
