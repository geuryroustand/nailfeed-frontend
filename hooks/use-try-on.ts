"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"

type TryOnState = "idle" | "capturing" | "captured"

interface UseTryOn {
  state: TryOnState
  error: string | null
  videoRef: React.RefObject<HTMLVideoElement>
  startCapture: () => Promise<void>
  stopCapture: () => void
  capture: () => void
  reset: () => void
}

const useTryOn = (): UseTryOn => {
  const [state, setState] = useState<TryOnState>("idle")
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCapture = useCallback(async () => {
    try {
      setState("capturing")
      setError(null)

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser")
      }

      // Request camera access with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error)
        }
      }
    } catch (err) {
      console.error("Camera access error:", err)
      let errorMessage = "Failed to access camera"

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera permission denied. Please allow camera access and try again."
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again."
        } else if (err.name === "NotSupportedError") {
          errorMessage = "Camera is not supported in this browser."
        }
      }

      setError(errorMessage)
      setState("idle")
    }
  }, [])

  const stopCapture = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setState("idle")
  }, [])

  const capture = useCallback(() => {
    setState("captured")
  }, [])

  const reset = useCallback(() => {
    stopCapture()
    setState("idle")
    setError(null)
  }, [])

  return {
    state,
    error,
    videoRef,
    startCapture,
    stopCapture,
    capture,
    reset,
  }
}

export default useTryOn
