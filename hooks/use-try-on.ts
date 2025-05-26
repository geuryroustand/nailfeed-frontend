"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { applyNailDesign, initMediaPipe } from "@/lib/try-on-utils"

type TryOnState = "idle" | "capturing" | "processing" | "result" | "error"

export function useTryOn(designImageUrl: string) {
  const [state, setState] = useState<TryOnState>("idle")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMediaPipeInitialized, setIsMediaPipeInitialized] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize MediaPipe when the hook is first used
  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await initMediaPipe()
        setIsMediaPipeInitialized(initialized)
        if (!initialized) {
          console.warn("MediaPipe initialization failed, will use fallback detection")
        }
      } catch (err) {
        console.error("Error initializing MediaPipe:", err)
      }
    }

    initialize()
  }, [])

  // Preload the design image
  useEffect(() => {
    if (designImageUrl) {
      const img = new Image()
      img.src = designImageUrl
    }
  }, [designImageUrl])

  const startCapture = useCallback(async () => {
    try {
      setState("capturing")
      setError(null)

      // Request camera access with specific constraints for better quality
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Error playing video:", err)
            setError("Failed to start video stream. Please try again.")
            setState("idle")
          })
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      let errorMessage = "Failed to access camera. Please ensure you have granted camera permissions."

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera access in your browser settings."
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again."
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera is in use by another application. Please close other apps using your camera."
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "Camera constraints not satisfied. Please try a different camera."
        } else if (err.name === "AbortError") {
          errorMessage = "Camera access aborted. Please try again."
        }
      }

      setError(errorMessage)
      setState("idle")
    }
  }, [])

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      setState("processing")
      setProcessingProgress(10)

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) throw new Error("Could not get canvas context")

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0)
      setProcessingProgress(30)

      // Get the captured image as data URL
      const imageDataUrl = canvas.toDataURL("image/png")
      setCapturedImage(imageDataUrl)
      setProcessingProgress(50)

      // Stop the camera
      stopCapture()

      // Apply the nail design
      setProcessingProgress(70)
      const result = await applyNailDesign(imageDataUrl, designImageUrl)
      setProcessingProgress(100)
      setResultImage(result)
      setState("result")
    } catch (err) {
      console.error("Error capturing photo:", err)
      setError("Failed to process the image. Please try again.")
      setState("error")
    }
  }, [designImageUrl, stopCapture])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        setState("processing")
        setError(null)
        setProcessingProgress(10)

        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Please select an image file")
        }

        // Read the file as data URL
        const reader = new FileReader()
        reader.onload = async (e) => {
          const imageDataUrl = e.target?.result as string
          setCapturedImage(imageDataUrl)
          setProcessingProgress(40)

          // Preload the image to get dimensions
          const img = new Image()
          img.onload = async () => {
            // Check if image is too small
            if (img.width < 300 || img.height < 300) {
              setError("Image is too small. Please use a larger image for better results.")
              setState("error")
              return
            }

            // Apply the nail design
            try {
              setProcessingProgress(60)
              const result = await applyNailDesign(imageDataUrl, designImageUrl)
              setProcessingProgress(100)
              setResultImage(result)
              setState("result")
            } catch (err) {
              console.error("Error processing uploaded image:", err)
              setError("Failed to process the image. Please try again with a different image.")
              setState("error")
            }
          }

          img.onerror = () => {
            setError("Failed to load the image. Please try a different image.")
            setState("error")
          }

          img.src = imageDataUrl
        }

        reader.onerror = () => {
          setError("Failed to read the image file. Please try again.")
          setState("error")
        }

        reader.readAsDataURL(file)
      } catch (err) {
        console.error("Error reading file:", err)
        setError(err instanceof Error ? err.message : "Failed to read the image file. Please try again.")
        setState("error")
      }
    },
    [designImageUrl],
  )

  const reset = useCallback(() => {
    stopCapture()
    setState("idle")
    setCapturedImage(null)
    setResultImage(null)
    setError(null)
    setProcessingProgress(0)
  }, [stopCapture])

  return {
    state,
    capturedImage,
    resultImage,
    error,
    processingProgress,
    videoRef,
    canvasRef,
    startCapture,
    capturePhoto,
    handleFileUpload,
    reset,
    isMediaPipeInitialized,
  }
}
