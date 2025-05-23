"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { createHandsDetector, applyNailDesign } from "@/lib/try-on-utils"

type TryOnState = "idle" | "capturing" | "processing" | "result" | "error" | "permission-denied"

export function useTryOn(designImageUrl: string) {
  const [state, setState] = useState<TryOnState>("idle")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const designImageRef = useRef<HTMLImageElement | null>(null)

  // Load the design image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous" // Important for CORS
    img.src = designImageUrl
    img.onload = () => {
      designImageRef.current = img
    }
    img.onerror = () => {
      setError("Failed to load design image")
    }

    return () => {
      // Clean up
      if (designImageRef.current) {
        designImageRef.current = null
      }
    }
  }, [designImageUrl])

  // Function to check camera permissions
  const checkCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if the Permissions API is supported
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: "camera" as PermissionName })

        if (result.state === "granted") {
          return true
        }

        if (result.state === "denied") {
          setState("permission-denied")
          setError("Camera access is denied. Please enable camera access in your browser settings.")
          return false
        }
      }

      // If Permissions API is not available or permission is prompt, try to access the camera
      return true
    } catch (err) {
      console.error("Error checking camera permission:", err)
      return true // Proceed with camera access attempt
    }
  }, [])

  // Function to request camera permissions explicitly
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Try to get user media to trigger the permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      // If we get here, permission was granted
      stream.getTracks().forEach((track) => track.stop()) // Stop the stream
      return true
    } catch (err) {
      console.error("Error requesting camera permission:", err)
      setState("permission-denied")
      setError("Camera access was denied. Please enable camera access and try again.")
      return false
    }
  }, [])

  // Start camera capture
  const startCapture = useCallback(async () => {
    setError(null)

    try {
      // Check if camera permission is granted
      const hasPermission = await checkCameraPermission()
      if (!hasPermission) {
        // Try to request permission explicitly
        const permissionGranted = await requestPermissions()
        if (!permissionGranted) {
          return
        }
      }

      // Wait a moment to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Get video element
      const videoElement = videoRef.current
      if (!videoElement) {
        console.error("Video element reference is null. Component might not be mounted yet.")
        setState("error")
        setError("Video element not found. Please try again.")
        return
      }

      // Get user media
      const constraints = {
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Double check video element is still available
      if (!videoRef.current) {
        // Clean up stream if video element is no longer available
        stream.getTracks().forEach((track) => track.stop())
        setState("error")
        setError("Video element was removed. Please try again.")
        return
      }

      // Set stream to video element
      videoRef.current.srcObject = stream
      streamRef.current = stream

      // Update state
      setState("capturing")
    } catch (err) {
      console.error("Error starting camera:", err)

      // Check if this is a permission error
      if (
        err instanceof Error &&
        (err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.message.includes("permission") ||
          err.message.includes("denied"))
      ) {
        setState("permission-denied")
        setError("Camera access error: Permission denied. Please enable camera access in your browser settings.")
      } else {
        setState("error")
        setError(`Error accessing camera: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }, [checkCameraPermission, requestPermissions])

  // Capture photo from video
  const capturePhoto = useCallback(() => {
    try {
      const videoElement = videoRef.current
      const canvasElement = canvasRef.current

      if (!videoElement || !canvasElement) {
        throw new Error("Video or canvas element not found")
      }

      // Set canvas dimensions to match video
      canvasElement.width = videoElement.videoWidth
      canvasElement.height = videoElement.videoHeight

      // Draw video frame to canvas
      const ctx = canvasElement.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

      // Get image data URL
      const imageDataUrl = canvasElement.toDataURL("image/png")
      setCapturedImage(imageDataUrl)

      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Process the captured image
      processImage(canvasElement)
    } catch (err) {
      console.error("Error capturing photo:", err)
      setState("error")
      setError(`Error capturing photo: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) {
        throw new Error("No file selected")
      }

      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        throw new Error("Selected file is not an image")
      }

      // Create a FileReader to read the file
      const reader = new FileReader()

      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        setCapturedImage(imageDataUrl)

        // Load the image to a canvas for processing
        const img = new Image()
        img.onload = () => {
          const canvasElement = canvasRef.current
          if (!canvasElement) {
            throw new Error("Canvas element not found")
          }

          // Set canvas dimensions to match image
          canvasElement.width = img.width
          canvasElement.height = img.height

          // Draw image to canvas
          const ctx = canvasElement.getContext("2d")
          if (!ctx) {
            throw new Error("Could not get canvas context")
          }

          ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height)

          // Process the image
          processImage(canvasElement)
        }

        img.onerror = () => {
          setState("error")
          setError("Error loading the selected image")
        }

        img.src = imageDataUrl
      }

      reader.onerror = () => {
        setState("error")
        setError("Error reading the selected file")
      }

      reader.readAsDataURL(file)

      // Stop video stream if it's running
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    } catch (err) {
      console.error("Error handling file upload:", err)
      setState("error")
      setError(`Error processing image: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  // Process the captured image
  const processImage = useCallback(async (canvas: HTMLCanvasElement) => {
    setState("processing")
    setError(null)

    try {
      // Check if design image is loaded
      if (!designImageRef.current) {
        throw new Error("Design image not loaded")
      }

      // Create a copy of the canvas for processing
      const processingCanvas = document.createElement("canvas")
      processingCanvas.width = canvas.width
      processingCanvas.height = canvas.height

      const ctx = processingCanvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Copy the original image to the processing canvas
      ctx.drawImage(canvas, 0, 0)

      // Create an image from the canvas for hand detection
      const img = new Image()
      img.src = canvas.toDataURL()

      img.onload = async () => {
        try {
          // Create hands detector
          const detector = await createHandsDetector()

          // Process the image
          const results = await detector.send({ image: img })

          // Check if hands were detected
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Apply nail design to the detected hands
            applyNailDesign(processingCanvas, results.multiHandLandmarks, designImageRef.current!)

            // Get the result image
            const resultDataUrl = processingCanvas.toDataURL("image/png")
            setResultImage(resultDataUrl)
            setState("result")
          } else {
            throw new Error("No hands detected in the image")
          }
        } catch (err) {
          console.error("Error in hand detection:", err)
          setState("error")
          setError(`Error processing image: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      img.onerror = () => {
        setState("error")
        setError("Error loading the captured image for processing")
      }
    } catch (err) {
      console.error("Error processing image:", err)
      setState("error")
      setError(`Error processing image: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  // Reset the try-on process
  const reset = useCallback(() => {
    // Stop video stream if it's running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Reset state
    setState("idle")
    setCapturedImage(null)
    setResultImage(null)
    setError(null)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

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
    requestPermissions,
  }
}
