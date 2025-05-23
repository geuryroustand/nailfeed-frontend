"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ZoomIn, ZoomOut, Move } from "lucide-react"
import { cn } from "@/lib/utils"

interface ZoomableImageProps {
  src: string
  alt: string
  className?: string
}

export function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset position when zoom is toggled off
  useEffect(() => {
    if (!isZoomed) {
      setPosition({ x: 0, y: 0 })
    }
  }, [isZoomed])

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return

    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Optional: Add bounds to prevent dragging too far
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Clean up event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg bg-white",
        isZoomed ? "cursor-move" : "cursor-zoom-in",
        className,
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={cn(
          "relative h-[500px] w-full transition-transform duration-300",
          isZoomed ? "scale-200" : "scale-100",
        )}
        style={{
          transform: isZoomed ? `scale(2) translate(${position.x / 2}px, ${position.y / 2}px)` : "scale(1)",
        }}
      >
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
          priority
          onClick={handleZoomToggle}
          onError={(e) => {
            console.error("Image failed to load:", src)
          }}
        />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          onClick={handleZoomToggle}
          className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
          aria-label={isZoomed ? "Zoom out" : "Zoom in"}
        >
          {isZoomed ? <ZoomOut className="h-5 w-5 text-gray-700" /> : <ZoomIn className="h-5 w-5 text-gray-700" />}
        </button>
      </div>

      {/* Drag indicator */}
      {isZoomed && (
        <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md">
          <Move className="h-5 w-5 text-gray-700" />
        </div>
      )}
    </div>
  )
}
