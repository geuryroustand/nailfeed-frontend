"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface LandmarkPointProps {
  id: number
  initialX: number
  initialY: number
  color?: string
  onPositionChange: (id: number, x: number, y: number) => void
  containerRef: React.RefObject<HTMLElement>
  pointSize?: number
}

const LandmarkPoint: React.FC<LandmarkPointProps> = ({
  id,
  initialX,
  initialY,
  color = "rgba(255, 0, 0, 0.7)",
  onPositionChange,
  containerRef,
  pointSize = 12,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const pointRef = useRef<HTMLDivElement>(null)
  // Store the offset from the mouse click to the top-left of the point
  const dragStartOffset = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!pointRef.current || !containerRef.current) return

    e.preventDefault() // Prevent default drag behavior and text selection
    e.stopPropagation()

    setIsDragging(true)
    const pointRect = pointRef.current.getBoundingClientRect()
    // Calculate offset from mouse click relative to the point's top-left corner
    dragStartOffset.current = {
      x: e.clientX - pointRect.left,
      y: e.clientY - pointRect.top,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || !pointRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()

      // Calculate new position relative to the container's top-left
      // Adjust by the initial mouse offset within the point
      const newX = e.clientX - containerRect.left - dragStartOffset.current.x + pointSize / 2
      const newY = e.clientY - containerRect.top - dragStartOffset.current.y + pointSize / 2

      // The newX, newY are now the desired top-left for the point,
      // but onPositionChange expects the center.
      // Since style uses translate(-50%, -50%), newX, newY are effectively centers.
      onPositionChange(id, newX, newY)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("mouseleave", handleMouseUp) // Handle mouse leaving window
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mouseleave", handleMouseUp)
    }
  }, [isDragging, onPositionChange, containerRef, id, pointSize])

  return (
    <div
      ref={pointRef}
      style={{
        position: "absolute",
        left: `${initialX}px`,
        top: `${initialY}px`,
        width: `${pointSize}px`,
        height: `${pointSize}px`,
        backgroundColor: color,
        borderRadius: "50%",
        cursor: isDragging ? "grabbing" : "grab",
        transform: "translate(-50%, -50%)", // Center the dot on the coordinate
        userSelect: "none",
        touchAction: "none", // Prevent scrolling on touch devices
        zIndex: 100, // Ensure points are on top
      }}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
      aria-label={`Landmark ${id}. Draggable point.`}
    />
  )
}

export default LandmarkPoint
