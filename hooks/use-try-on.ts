"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { initMediaPipe, applyNailDesign } from "@/lib/try-on-utils"

type TryOnState = "idle" | "capturing" | "processing" | "result"

export function useTryOn(designImageUrl: string) {
  const [state, setState] = useState<TryOnState>("idle")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMediaPipeInitialized, setIsMediaPipeInitialized] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize MediaPipe when the hook is first used
  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await initMediaPipe()
        setIsMediaPipeInitialized(initialized)
        if (!initialized) {
          setError("Failed to initialize MediaPipe. Please check your device compatibility.")
        }
      } catch (err) {
        console.error("MediaPipe initialization error:", err)
        setError("Could not initialize hand tracking. Please try again later.")
      }
    }

    initialize()
  }, [])

  const startCapture = useCallback(async () => {
    setError(null)
    setState("capturing")

    try {
      // Request camera with environment mode first (for mobile devices)
      // Fall back to user-facing camera if that fails
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (envError) {
        console.warn("Could not access environment camera, trying user camera:", envError)
        
        // Try with user-facing camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.")
      setState("idle")
      console.error("Camera access error:", err)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to data URL
    const imageDataUrl = canvas.toDataURL("image/png")
    setCapturedImage(imageDataUrl)

    // Stop the camera stream
    const stream = video.srcObject as MediaStream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    // Move to processing state
    setState("processing")

    // Process the image
    processImage(imageDataUrl)
  }, [])

  const processImage = useCallback(
    async (imageDataUrl: string) => {
      try {
        // Check if MediaPipe is initialized
        if (!isMediaPipeInitialized) {
          // Try to initialize again if it failed before
          const initialized = await initMediaPipe()
          if (!initialized) {
            throw new Error("MediaPipe hand tracking is not available")
          }
          setIsMediaPipeInitialized(true)
        }

        // Process the image with nail design overlay
        const result = await applyNailDesign(imageDataUrl, designImageUrl)
        setResultImage(result)
        setState("result")
      } catch (err) {
        console.error("Image processing error:", err)
        setError("Failed to process image. Please try again with a clearer photo of your hand.")
        setState("idle")
      }
    },
    [designImageUrl, isMediaPipeInitialized],
  )

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Check if the file is an image
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        setCapturedImage(imageDataUrl)
        setState("processing")
        processImage(imageDataUrl)
      }
      reader.readAsDataURL(file)
    },
    [processImage],
  )

  const reset = useCallback(() => {
    setState("idle")
    setCapturedImage(null)
    setResultImage(null)
    setError(null)
    // Don't reset MediaPipe initialization state
    startCapture() // Restart camera when resetting
  }, [startCapture])

  return {
    state,
    capturedImage,
    resultImage,
    error,
    videoRef,
    canvasRef,
    startCapture,
    capturePhoto,
    handleFileUpload,
    reset,
  }
}
