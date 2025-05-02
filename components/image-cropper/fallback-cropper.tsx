"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, ZoomOut, Move, RefreshCw, AlertCircle } from "lucide-react"

interface FallbackCropperProps {
  image: string
  aspect: number
  cropShape?: "rect" | "round"
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
}

export default function FallbackCropper({
  image,
  aspect,
  cropShape = "rect",
  onCropComplete,
  onCancel,
}: FallbackCropperProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const [loadingImage, setLoadingImage] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropAreaRef = useRef<HTMLDivElement>(null)
  const lastPositionRef = useRef({ x: 0, y: 0, scale: 1 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Create a hidden canvas element for preview generation
  useEffect(() => {
    // Create canvas element if it doesn't exist
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas")
      canvas.style.display = "none"
      document.body.appendChild(canvas)
      canvasRef.current = canvas
    }

    // Cleanup function to remove canvas when component unmounts
    return () => {
      if (canvasRef.current) {
        document.body.removeChild(canvasRef.current)
        canvasRef.current = null
      }
    }
  }, [])

  // Handle image load
  const handleImageLoad = () => {
    if (imageRef.current) {
      const { width, height, naturalWidth, naturalHeight } = imageRef.current
      setImageSize({ width, height, naturalWidth, naturalHeight })

      // Center the image initially
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newPosition = {
          x: (containerRect.width - width) / 2,
          y: (containerRect.height - height) / 2,
        }
        setPosition(newPosition)
        lastPositionRef.current = { ...newPosition, scale }
      }
      setIsImageLoaded(true)
      setLoadingImage(false)

      // Generate initial preview after a short delay
      setTimeout(() => {
        generatePreview(true)
      }, 300)
    }
  }

  // Handle image error
  const handleImageError = () => {
    setError("Error loading image. Please try another image.")
    setLoadingImage(false)
  }

  // Mouse event handlers
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    })
  }

  const moveDrag = (clientX: number, clientY: number) => {
    if (isDragging) {
      const newX = clientX - dragStart.x
      const newY = clientY - dragStart.y
      setPosition({
        x: newX,
        y: newY,
      })
    }
  }

  const endDrag = () => {
    setIsDragging(false)
    // Force preview update immediately after drag ends
    if (
      lastPositionRef.current.x !== position.x ||
      lastPositionRef.current.y !== position.y ||
      lastPositionRef.current.scale !== scale
    ) {
      lastPositionRef.current = { ...position, scale }
      generatePreview(true)
    }
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startDrag(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    moveDrag(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    endDrag()
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault()
      const touch = e.touches[0]
      startDrag(touch.clientX, touch.clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0]
      moveDrag(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = () => {
    endDrag()
  }

  // Generate preview of cropped image
  const generatePreview = (force = false) => {
    if (!cropAreaRef.current || !imageRef.current || (!force && isGeneratingPreview)) return

    try {
      setIsGeneratingPreview(true)
      setPreviewError(false)

      // Get the DOM elements' bounding rectangles
      const cropRect = cropAreaRef.current.getBoundingClientRect()
      const imageRect = imageRef.current.getBoundingClientRect()

      // Early exit if either rect has zero dimensions
      if (cropRect.width === 0 || cropRect.height === 0 || imageRect.width === 0 || imageRect.height === 0) {
        console.warn("Zero dimension rect detected during preview generation")
        setIsGeneratingPreview(false)
        return
      }

      // Get the natural dimensions of the image
      const { naturalWidth, naturalHeight } = imageRef.current

      // Calculate the ratio between natural size and displayed size
      const displayToNaturalRatioX = naturalWidth / (imageRect.width / scale)
      const displayToNaturalRatioY = naturalHeight / (imageRect.height / scale)

      // Calculate the position of the crop area relative to the image
      const relX = cropRect.left - imageRect.left
      const relY = cropRect.top - imageRect.top

      // Convert to coordinates in the natural image
      const sourceX = (relX / scale) * ((naturalWidth / imageRect.width) * scale)
      const sourceY = (relY / scale) * ((naturalHeight / imageRect.height) * scale)
      const sourceWidth = (cropRect.width / scale) * ((naturalWidth / imageRect.width) * scale)
      const sourceHeight = (cropRect.height / scale) * ((naturalHeight / imageRect.height) * scale)

      // Get or create canvas
      const canvas = canvasRef.current || document.createElement("canvas")

      // Set canvas dimensions to match crop area
      canvas.width = Math.max(1, Math.floor(cropRect.width))
      canvas.height = Math.max(1, Math.floor(cropRect.height))

      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) {
        console.error("Could not get canvas context")
        setIsGeneratingPreview(false)
        setPreviewError(true)
        return
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fill with white background
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the cropped portion of the image
      try {
        ctx.drawImage(
          imageRef.current,
          Math.max(0, sourceX),
          Math.max(0, sourceY),
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        )
      } catch (err) {
        console.error("Error drawing image to canvas:", err, {
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
        })
        setIsGeneratingPreview(false)
        setPreviewError(true)
        return
      }

      // Convert to data URL
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9)

        // Validate data URL
        if (!dataUrl || dataUrl === "data:," || dataUrl.length < 22) {
          console.error("Invalid data URL generated")
          setIsGeneratingPreview(false)
          setPreviewError(true)
          return
        }

        setPreviewUrl(dataUrl)
        setPreviewError(false)
      } catch (err) {
        console.error("Error generating data URL:", err)
        setPreviewError(true)
      } finally {
        setIsGeneratingPreview(false)
      }
    } catch (err) {
      console.error("Error in preview generation:", err)
      setPreviewError(true)
      setIsGeneratingPreview(false)
    }
  }

  // Pre-load the image to ensure it's in the browser cache
  useEffect(() => {
    if (!image) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Image is now loaded in cache
      console.log("Image pre-loaded into cache")
    }
    img.onerror = () => {
      console.error("Failed to pre-load image")
    }
    img.src = image
  }, [image])

  // Force preview refresh
  const forcePreviewRefresh = () => {
    setPreviewError(false)
    generatePreview(true)
  }

  // Create final cropped image
  const handleComplete = async () => {
    // Force generate a fresh preview before completing
    generatePreview(true)

    // Small delay to ensure preview is generated
    setTimeout(async () => {
      if (previewError || !previewUrl) {
        setError("Unable to generate preview. Please try again.")
        return
      }

      try {
        // Convert data URL to blob
        const response = await fetch(previewUrl)
        const blob = await response.blob()

        // Validate blob
        if (blob.size === 0) {
          throw new Error("Generated empty blob")
        }

        onCropComplete(blob)
      } catch (err) {
        console.error("Error creating cropped image:", err)
        setError("Error creating cropped image")
      }
    }, 100)
  }

  // Reset position and scale
  const handleReset = () => {
    setScale(1)
    if (containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const imageWidth = imageRef.current.width
      const imageHeight = imageRef.current.height
      const newPosition = {
        x: (containerRect.width - imageWidth) / 2,
        y: (containerRect.height - imageHeight) / 2,
      }
      setPosition(newPosition)
      lastPositionRef.current = { ...newPosition, scale: 1 }
      // Force preview update after reset
      setTimeout(() => generatePreview(true), 50)
    }
  }

  // Update preview when position or scale changes
  useEffect(() => {
    if (!isImageLoaded || isDragging) return

    const debounceTimer = setTimeout(() => {
      if (
        lastPositionRef.current.x !== position.x ||
        lastPositionRef.current.y !== position.y ||
        lastPositionRef.current.scale !== scale
      ) {
        lastPositionRef.current = { ...position, scale }
        generatePreview()
      }
    }, 150)

    return () => clearTimeout(debounceTimer)
  }, [position.x, position.y, scale, isImageLoaded, isDragging])

  // Generate initial preview when image is loaded
  useEffect(() => {
    if (isImageLoaded && !previewUrl && !previewError) {
      generatePreview(true)
    }
  }, [isImageLoaded, previewUrl, previewError])

  // Calculate crop area dimensions based on aspect ratio
  const getCropAreaDimensions = () => {
    if (!containerRef.current) return { width: 200, height: 200 }

    const containerRect = containerRef.current.getBoundingClientRect()
    const maxWidth = containerRect.width * 0.8
    const maxHeight = containerRect.height * 0.8

    let width, height

    if (aspect >= 1) {
      width = Math.min(maxWidth, 250)
      height = width / aspect
    } else {
      height = Math.min(maxHeight, 250)
      width = height * aspect
    }

    return { width, height }
  }

  const cropDimensions = getCropAreaDimensions()

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alternative Cropping Method</DialogTitle>
        </DialogHeader>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">{error}</div>}

        <div className="flex flex-col items-center gap-4">
          {/* Instructions */}
          <div className="text-center text-sm bg-blue-50 border border-blue-200 text-blue-700 p-2 rounded-md w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Move size={16} className="animate-pulse" />
              <span className="font-medium">Drag the image</span> to adjust it to the crop area
            </div>
            <p>The crop area is fixed (central frame). Move the image until you get the desired framing.</p>
          </div>

          {/* Cropping area */}
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-gray-800 rounded-md h-[400px] w-full"
            style={{ touchAction: "none" }}
          >
            {loadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
                <RefreshCw className="h-10 w-10 text-white animate-spin" />
                <span className="text-white ml-2">Loading image...</span>
              </div>
            )}

            {/* Image to crop */}
            <div
              className="absolute inset-0 overflow-visible"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: "none" }}
            >
              <img
                ref={imageRef}
                src={image || "/placeholder.svg"}
                alt="Image to crop"
                className="absolute"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  cursor: isDragging ? "grabbing" : "grab",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  pointerEvents: "auto",
                  touchAction: "none",
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                crossOrigin="anonymous"
                draggable="false"
              />
            </div>

            {/* Crop overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none">
              {/* Fixed crop area */}
              <div
                ref={cropAreaRef}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${cropDimensions.width}px`,
                  height: `${cropDimensions.height}px`,
                  transform: "translate(-50%, -50%)",
                  borderRadius: cropShape === "round" ? "50%" : "0",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                  border: isDragging ? "3px solid #3b82f6" : "3px dashed white",
                  outline: "1px solid black",
                }}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-gray-500">Preview:</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={forcePreviewRefresh}
                title="Refresh preview"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              {isGeneratingPreview && <span className="text-xs text-gray-400">Updating...</span>}
            </div>
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: cropShape === "round" ? "50%" : "4px",
                border: "1px solid #ddd",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f9f9f9",
                position: "relative",
              }}
            >
              {previewUrl && !previewError ? (
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  onError={() => {
                    console.error("Preview image failed to load")
                    setPreviewError(true)
                  }}
                />
              ) : previewError ? (
                <div className="text-sm text-red-500 text-center flex flex-col items-center gap-2 p-2">
                  <AlertCircle className="h-6 w-6" />
                  <span>Preview unavailable</span>
                  <Button variant="outline" size="sm" onClick={forcePreviewRefresh} className="mt-1 text-xs h-7 px-2">
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center">
                  {isImageLoaded ? "Generating preview..." : "Loading image..."}
                </div>
              )}
              {isGeneratingPreview && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Zoom</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setScale((prev) => {
                      const newScale = Math.max(prev - 0.1, 0.5)
                      return newScale
                    })
                  }}
                  disabled={scale <= 0.5 || !isImageLoaded}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Slider
                  value={[scale]}
                  min={0.5}
                  max={3}
                  step={0.01}
                  onValueChange={(value) => setScale(value[0])}
                  className="w-32"
                  disabled={!isImageLoaded}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setScale((prev) => {
                      const newScale = Math.min(prev + 0.1, 3)
                      return newScale
                    })
                  }}
                  disabled={scale >= 3 || !isImageLoaded}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 ml-2"
                  onClick={handleReset}
                  disabled={!isImageLoaded}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={!isImageLoaded || (!previewUrl && !previewError) || isGeneratingPreview}
          >
            {previewError ? "Apply (Preview Unavailable)" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
