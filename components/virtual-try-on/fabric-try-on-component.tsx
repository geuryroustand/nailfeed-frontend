"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { fabric } from "fabric"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import type { PixelCoordinate } from "@/lib/mediapipe-hand-utils" // Assuming this type is exported
import { calculateInitialNailTransform } from "@/lib/fabric-utils"

interface FabricTryOnComponentProps {
  handImageSrc: string | null
  nailDesignSrc: string | null
  targetLandmark: PixelCoordinate | null // e.g., Index finger tip (landmark 8)
  orientationLandmark?: PixelCoordinate | null // e.g., Index finger DIP (landmark 7)
  handImageNaturalDimensions: { width: number; height: number } | null
}

const FabricTryOnComponent: React.FC<FabricTryOnComponentProps> = ({
  handImageSrc,
  nailDesignSrc,
  targetLandmark,
  orientationLandmark,
  handImageNaturalDimensions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [opacity, setOpacity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasRef.current.parentElement?.clientWidth || 500,
      height: ((canvasRef.current.parentElement?.clientWidth || 500) * 3) / 4, // Maintain 4:3 aspect ratio
      backgroundColor: "#f0f0f0",
    })
    fabricCanvasRef.current = canvas

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.setWidth(width)
        canvas.setHeight(height)
        canvas.renderAll()
      }
    })

    if (canvasRef.current.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement)
    }

    return () => {
      resizeObserver.disconnect()
      canvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !handImageSrc || !handImageNaturalDimensions) {
      // Clear canvas if no hand image
      canvas?.clear()
      canvas?.setBackgroundColor("#f0f0f0", () => canvas.renderAll())
      return
    }

    setIsLoading(true)
    fabric.Image.fromURL(
      handImageSrc,
      (img) => {
        if (!canvasRef.current) return
        // Scale hand image to fit canvas width while maintaining aspect ratio
        const canvasWidth = canvas.getWidth()
        const scale = canvasWidth / img.width!
        const canvasHeight = img.height! * scale

        canvas.setDimensions({ width: canvasWidth, height: canvasHeight })

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          scaleX: scale,
          scaleY: scale,
        })
        setIsLoading(false)
      },
      { crossOrigin: "anonymous" },
    )
  }, [handImageSrc, handImageNaturalDimensions])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !nailDesignSrc || !targetLandmark || !handImageNaturalDimensions || !handImageSrc) {
      // Clear previous nail designs if new hand image or no nail design
      canvas?.getObjects("image").forEach((obj) => {
        if (obj.name !== "handBackgroundImage") {
          // Assuming background image is not named or named differently
          canvas.remove(obj)
        }
      })
      canvas?.renderAll()
      return
    }

    setIsLoading(true)
    // Remove previous nail design if any
    canvas.getObjects("image").forEach((obj) => {
      if (obj.name === "nailDesign") {
        canvas.remove(obj)
      }
    })

    const nailImgElement = new Image()
    nailImgElement.crossOrigin = "anonymous"
    nailImgElement.src = nailDesignSrc
    nailImgElement.onload = () => {
      const initialTransform = calculateInitialNailTransform(
        nailImgElement,
        targetLandmark,
        orientationLandmark || undefined,
        canvas.getWidth(),
        canvas.getHeight(),
        handImageNaturalDimensions.width,
        handImageNaturalDimensions.height,
      )

      fabric.Image.fromURL(
        nailDesignSrc,
        (nailImg) => {
          nailImg.set({
            left: initialTransform.left,
            top: initialTransform.top,
            scaleX: initialTransform.scaleX,
            scaleY: initialTransform.scaleY,
            angle: initialTransform.angle,
            opacity: opacity,
            originX: "center",
            originY: "center",
            cornerColor: "rgb(139, 92, 246)", // A nice purple for controls
            borderColor: "rgb(139, 92, 246)",
            cornerSize: 10,
            transparentCorners: false,
            name: "nailDesign", // To identify this object later
          })
          canvas.add(nailImg)
          canvas.setActiveObject(nailImg) // Make it active for immediate manipulation
          canvas.renderAll()
          setIsLoading(false)
        },
        { crossOrigin: "anonymous" },
      )
    }
    nailImgElement.onerror = () => {
      console.error("Failed to load nail design image for measurements.")
      setIsLoading(false)
    }
  }, [nailDesignSrc, targetLandmark, orientationLandmark, handImageNaturalDimensions, handImageSrc, opacity]) // Re-run if opacity changes from slider too

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    const activeObject = canvas?.getActiveObject()
    if (activeObject && activeObject.name === "nailDesign" && activeObject.type === "image") {
      ;(activeObject as fabric.Image).set("opacity", opacity)
      canvas.renderAll()
    }
  }, [opacity])

  return (
    <div className="space-y-4">
      <div className="w-full aspect-[4/3] border rounded-md overflow-hidden relative bg-gray-200">
        <canvas ref={canvasRef} />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <p className="text-white text-lg">Loading...</p>
          </div>
        )}
      </div>
      <div className="p-4 border rounded-md bg-gray-50">
        <Label htmlFor="opacity-slider" className="mb-2 block text-sm font-medium text-gray-700">
          Nail Design Opacity: {Math.round(opacity * 100)}%
        </Label>
        <Slider
          id="opacity-slider"
          min={0}
          max={1}
          step={0.01}
          value={[opacity]}
          onValueChange={(value) => setOpacity(value[0])}
          disabled={isLoading || !fabricCanvasRef.current?.getActiveObject()}
        />
      </div>
    </div>
  )
}

export default FabricTryOnComponent
