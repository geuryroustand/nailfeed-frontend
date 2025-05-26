"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { applyNailDesign } from "@/lib/try-on-utils"

type TryOnState = "idle" | "capturing" | "processing" | "result" | "error"

export function useTryOn(designImageUrl: string) {
  const [state, setState] = useState<TryOnState>("idle")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCapture = useCallback(async () => {
    try {
      setState("capturing")
      setError(null)

      // Request camera access
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
        await videoRef.current.play()
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Failed to access camera. Please ensure you have granted camera permissions.")
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

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) throw new Error("Could not get canvas context")

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0)

      // Get the captured image as data URL
      const imageDataUrl = canvas.toDataURL("image/png")
      setCapturedImage(imageDataUrl)

      // Stop the camera
      stopCapture()

      // Apply the nail design
      const result = await applyNailDesign(imageDataUrl, designImageUrl)
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

        // Read the file as data URL
        const reader = new FileReader()
        reader.onload = async (e) => {
          const imageDataUrl = e.target?.result as string
          setCapturedImage(imageDataUrl)

          // Apply the nail design
          try {
            const result = await applyNailDesign(imageDataUrl, designImageUrl)
            setResultImage(result)
            setState("result")
          } catch (err) {
            console.error("Error processing uploaded image:", err)
            setError("Failed to process the image. Please try again with a different image.")
            setState("error")
          }
        }
        reader.readAsDataURL(file)
      } catch (err) {
        console.error("Error reading file:", err)
        setError("Failed to read the image file. Please try again.")
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
  }, [stopCapture])

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
