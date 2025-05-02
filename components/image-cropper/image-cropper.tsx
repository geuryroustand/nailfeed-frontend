"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, ZoomOut, RefreshCw, AlertTriangle } from "lucide-react"
import "react-image-crop/dist/ReactCrop.css"
import getCroppedImg from "@/lib/crop-image"
import FallbackCropper from "./fallback-cropper"

interface ImageCropperProps {
  image: string
  aspect: number
  cropShape?: "rect" | "round"
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  maxWidth?: number
  maxHeight?: number
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropper({
  image,
  aspect,
  cropShape = "rect",
  onCropComplete,
  onCancel,
  maxWidth = 1200,
  maxHeight = 1200,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [cropVisible, setCropVisible] = useState(true)
  const [cropBorderWhite, setCropBorderWhite] = useState(true)
  const [useFallback, setUseFallback] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const cropComponentRef = useRef<any>(null)

  // Add CSS to ensure crop indicators are visible
  useEffect(() => {
    // Remove any existing style element with this ID
    const styleId = "crop-indicator-enhanced-styles"
    const existingStyle = document.getElementById(styleId)
    if (existingStyle) {
      existingStyle.remove()
    }

    // Add custom CSS to ensure crop indicators are visible
    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
      /* Make crop selection border very visible */
      .ReactCrop__crop-selection {
        border: 3px dashed ${cropBorderWhite ? "white" : "black"} !important;
        box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.6) !important;
        outline: 3px solid ${cropBorderWhite ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        z-index: 100 !important;
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
      }
      
      /* Make drag handles larger and more visible */
      .ReactCrop__drag-handle {
        width: 14px !important;
        height: 14px !important;
        background-color: ${cropBorderWhite ? "white" : "black"} !important;
        border: 2px solid ${cropBorderWhite ? "black" : "white"} !important;
        box-shadow: 0 0 4px rgba(${cropBorderWhite ? "0, 0, 0" : "255, 255, 255"}, 0.8) !important;
        z-index: 101 !important;
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
      }
      
      /* Make drag handle after element visible too */
      .ReactCrop__drag-handle::after {
        background-color: ${cropBorderWhite ? "white" : "black"} !important;
      }
      
      /* Ensure rule of thirds guides are visible */
      .ReactCrop__rule-of-thirds-vt::after, 
      .ReactCrop__rule-of-thirds-hz::after {
        background-color: rgba(${cropBorderWhite ? "255, 255, 255" : "0, 0, 0"}, 0.8) !important;
        box-shadow: 0 0 2px rgba(${cropBorderWhite ? "0, 0, 0" : "255, 255, 255"}, 0.5) !important;
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
      }
      
      /* Animation for forced refresh */
      .force-refresh {
        animation: flash 0.1s;
      }
      
      @keyframes flash {
        0% { opacity: 0.9; }
        100% { opacity: 1; }
      }
      
      /* Additional classes to ensure visibility */
      .ReactCrop {
        position: relative;
        max-width: 100%;
        z-index: 10;
      }
    `
    document.head.appendChild(style)

    return () => {
      // Clean up by removing the style when component unmounts
      if (document.getElementById(styleId)) {
        document.getElementById(styleId)?.remove()
      }
    }
  }, [cropBorderWhite])

  // Reset crop when image changes
  useEffect(() => {
    setImageLoaded(false)
    setPreviewDataUrl(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setScale(1)
    setRotate(0)
    setError(null)
    setCropVisible(true)
    setUseFallback(false)
  }, [image])

  // Force ReactCrop to refresh when component mounts or image changes
  useEffect(() => {
    const forceRefresh = () => {
      // Force a reflow of the crop component
      const cropContainer = document.querySelector(".ReactCrop")
      if (cropContainer) {
        // Force a reflow by accessing offsetHeight
        // eslint-disable-next-line no-unused-expressions
        cropContainer.offsetHeight

        // Add a class to force a repaint
        cropContainer.classList.add("force-refresh")
        setTimeout(() => {
          cropContainer.classList.remove("force-refresh")
        }, 50)
      }
    }

    // Initial delay to ensure component is mounted
    const timer = setTimeout(() => {
      forceRefresh()
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [image, imageLoaded])

  // Check if crop selection is visible after initial render
  useEffect(() => {
    if (imageLoaded) {
      // Check after a short delay to allow ReactCrop to render
      const timer = setTimeout(() => {
        const cropSelection = document.querySelector(".ReactCrop__crop-selection")
        const dragHandles = document.querySelectorAll(".ReactCrop__drag-handle")

        // If crop selection or handles are missing, force a refresh
        if (!cropSelection || dragHandles.length === 0) {
          console.log("Crop selection not found, forcing refresh...")
          forceShowCropSelection()
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [imageLoaded])

  // This function ensures the image is properly loaded before allowing cropping
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height, naturalWidth, naturalHeight } = e.currentTarget

      if (width === 0 || height === 0) {
        setError("Image failed to load properly. Please try a different image.")
        return
      }

      setDimensions({
        width: naturalWidth,
        height: naturalHeight,
      })

      // Calculate initial crop area
      const initialCrop = centerAspectCrop(width, height, aspect)

      // Small delay to ensure React-Crop is fully initialized
      setTimeout(() => {
        setCrop(initialCrop)

        // Also set an initial completed crop
        const pixelCrop: PixelCrop = {
          unit: "px",
          x: Math.round(initialCrop.unit === "px" ? initialCrop.x : (initialCrop.x / 100) * width),
          y: Math.round(initialCrop.unit === "px" ? initialCrop.y : (initialCrop.y / 100) * height),
          width: Math.round(initialCrop.unit === "px" ? initialCrop.width : (initialCrop.width / 100) * width),
          height: Math.round(initialCrop.unit === "px" ? initialCrop.height : (initialCrop.height / 100) * height),
        }
        setCompletedCrop(pixelCrop)

        setImageLoaded(true)
        setCropVisible(true)
        setError(null)
      }, 100)
    },
    [aspect],
  )

  // Generate preview when completedCrop changes
  useEffect(() => {
    async function updatePreview() {
      if (!completedCrop || !imgRef.current) return

      try {
        // Convert to pixels for the utility function
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height

        const pixelCrop = {
          x: Math.round(completedCrop.x * scaleX),
          y: Math.round(completedCrop.y * scaleY),
          width: Math.round(completedCrop.width * scaleX),
          height: Math.round(completedCrop.height * scaleY),
        }

        const croppedImageUrl = await getCroppedImg(imgRef.current.src, pixelCrop)
        setPreviewDataUrl(croppedImageUrl)
      } catch (err) {
        console.error("Error generating preview:", err)
        setError("Failed to generate preview. Please try again.")
      }
    }

    updatePreview()
  }, [completedCrop])

  // Handle crop change
  const handleCropChange = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop)
    setCropVisible(true)
  }, [])

  // Function to create a cropped image blob
  const createCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current || !previewDataUrl) {
      setError("Please select a crop area first")
      return null
    }

    try {
      // Convert the data URL to a blob
      const response = await fetch(previewDataUrl)
      const blob = await response.blob()
      return blob
    } catch (err) {
      console.error("Error creating cropped image:", err)
      setError("Failed to process the cropped image. Please try again.")
      return null
    }
  }, [completedCrop, previewDataUrl])

  const handleComplete = useCallback(async () => {
    if (!completedCrop) {
      setError("Please select a crop area first")
      return
    }

    try {
      const croppedImageBlob = await createCroppedImage()
      if (croppedImageBlob) {
        onCropComplete(croppedImageBlob)
      }
    } catch (err) {
      console.error("Error creating cropped image:", err)
      setError("Failed to process the cropped image. Please try again.")
    }
  }, [completedCrop, createCroppedImage, onCropComplete])

  const handleReset = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current
      const newCrop = centerAspectCrop(width, height, aspect)
      setCrop(newCrop)
      setScale(1)
      setRotate(0)
      setCropVisible(true)
    }
  }

  // Function to force show crop selection if it's not visible
  const forceShowCropSelection = () => {
    // Reset crop to force it to show
    setCropVisible(false)

    setTimeout(() => {
      if (imgRef.current) {
        const { width, height } = imgRef.current
        setCrop(centerAspectCrop(width, height, aspect))
        setCropVisible(true)
      }
    }, 50)
  }

  // Function to toggle crop border color for better visibility
  const toggleCropBorderColor = useCallback(() => {
    setCropBorderWhite((prev) => !prev)
  }, [])

  // Switch to fallback cropper
  const switchToFallback = () => {
    setUseFallback(true)
  }

  // If using fallback cropper
  if (useFallback) {
    return (
      <FallbackCropper
        image={image}
        aspect={aspect}
        cropShape={cropShape}
        onCropComplete={onCropComplete}
        onCancel={onCancel}
      />
    )
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">{error}</div>}

        <div className="flex flex-col items-center gap-4">
          <div className="relative overflow-hidden max-w-full bg-gray-100 rounded-md border border-gray-300">
            {cropVisible && (
              <ReactCrop
                ref={cropComponentRef}
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => handleCropChange(c)}
                aspect={aspect}
                circularCrop={cropShape === "round"}
                keepSelection
                minWidth={50}
                ruleOfThirds
                className="crop-container"
              >
                <img
                  ref={imgRef}
                  src={image || "/placeholder.svg"}
                  alt="Crop preview"
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxWidth: "100%",
                    maxHeight: "50vh",
                    display: "block",
                  }}
                  onLoad={onImageLoad}
                  crossOrigin="anonymous"
                  onError={() => {
                    setError("Failed to load image. Please try a different image.")
                  }}
                />
              </ReactCrop>
            )}

            {!cropVisible && (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <p>Reloading crop interface...</p>
              </div>
            )}
          </div>

          {/* Preview section */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-2">Preview:</p>
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
              }}
            >
              {previewDataUrl ? (
                <img
                  src={previewDataUrl || "/placeholder.svg"}
                  alt="Crop preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: cropShape === "round" ? "cover" : "contain",
                  }}
                />
              ) : (
                <div className="text-sm text-gray-400 text-center p-2">
                  {imageLoaded ? "Generating preview..." : "Select an area to preview"}
                </div>
              )}
            </div>
          </div>

          {imageLoaded && (
            <div className="w-full grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Zoom</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))}
                    disabled={scale <= 0.5}
                    aria-label="Zoom out"
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
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setScale((prev) => Math.min(prev + 0.1, 3))}
                    disabled={scale >= 3}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 ml-2"
                    onClick={handleReset}
                    aria-label="Reset crop"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!imageLoaded && !error && (
            <div className="py-8 text-center text-gray-500 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading image...
            </div>
          )}

          {imageLoaded && (
            <>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                <Button type="button" variant="outline" size="sm" onClick={forceShowCropSelection}>
                  Can't see crop selection?
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={toggleCropBorderColor}>
                  {cropBorderWhite ? "Switch to black border" : "Switch to white border"}
                </Button>
              </div>

              <div className="w-full">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300"
                  onClick={switchToFallback}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Use alternative crop method
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleComplete} disabled={!imageLoaded || !completedCrop || !previewDataUrl}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
