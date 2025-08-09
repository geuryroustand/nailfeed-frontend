"use client"

import { useState } from "react"
import Image from "next/image"

interface ExternalImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export function ExternalImage({ src, alt, width = 800, height = 600, className }: ExternalImageProps) {
  const [isError, setIsError] = useState(false)

  // For external images that might not work with Next.js Image
  if (isError || src.startsWith("https://nailfeed-backend-production.up.railway.app")) {
    return (
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={className}
        style={{ maxWidth: "100%", height: "auto" }}
        onError={() => console.error(`Failed to load image: ${src}`)}
      />
    )
  }

  return (
    <Image
      src={src || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setIsError(true)}
    />
  )
}
