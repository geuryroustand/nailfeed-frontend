"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Upload, Wand2, XCircle, CheckCircle, Hand, Sparkles } from "lucide-react"
import FabricTryOnComponent from "@/components/virtual-try-on/fabric-try-on-component"
import {
  initMediaPipeHands,
  processImageWithMediaPipe,
  extractAllHandLandmarksPixelCoords,
  type PixelCoordinate,
} from "@/lib/mediapipe-hand-utils" // Ensure PixelCoordinate is exported

// For this example, we'll target the index finger
const TARGET_FINGER_TIP_LANDMARK_ID = 8 // Index Finger Tip
const TARGET_FINGER_DIP_LANDMARK_ID = 7 // Index Finger DIP (for orientation)

const VirtualTryOnPage: React.FC = () => {
  const [handImageFile, setHandImageFile] = useState<File | null>(null)
  const [handImageSrc, setHandImageSrc] = useState<string | null>(null)
  const [handImageNaturalDimensions, setHandImageNaturalDimensions] = useState<{
    width: number
    height: number
  } | null>(null)

  const [nailDesignFile, setNailDesignFile] = useState<File | null>(null)
  const [nailDesignSrc, setNailDesignSrc] = useState<string | null>(null)

  const [detectedLandmarks, setDetectedLandmarks] = useState<PixelCoordinate[] | null>(null)
  const [mediaPipeHands, setMediaPipeHands] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>("")

  const handImageRef = useRef<HTMLImageElement>(null) // For MediaPipe processing
  const handFileInputRef = useRef<HTMLInputElement>(null)
  const nailFileInputRef = useRef<HTMLInputElement>(null)

  // Initialize MediaPipe
  useEffect(() => {
    async function initializeMediaPipe() {
      try {
        setStatusMessage("Initializing hand detection model...")
        setIsLoading(true)
        const hands = await initMediaPipeHands()
        setMediaPipeHands(hands)
        setStatusMessage("Model initialized. Ready to upload images.")
      } catch (err) {
        console.error("Failed to initialize MediaPipe:", err)
        setError(`Failed to initialize model: ${(err as Error).message}`)
        setStatusMessage("Error initializing model.")
      } finally {
        setIsLoading(false)
      }
    }
    initializeMediaPipe()
  }, [])

  const handleHandImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setHandImageFile(file)
      setDetectedLandmarks(null) // Reset landmarks
      setError(null)
      setStatusMessage("Hand image selected. Processing...")

      const reader = new FileReader()
      reader.onload = (e) => {
        setHandImageSrc(e.target?.result as string)
        // The actual processing will happen in the useEffect for handImageSrc
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNailDesignUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNailDesignFile(file)
      setError(null)
      setStatusMessage("Nail design selected.")
      const reader = new FileReader()
      reader.onload = (e) => {
        setNailDesignSrc(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Process hand image with MediaPipe when handImageSrc changes
  useEffect(() => {
    if (!handImageSrc || !mediaPipeHands || !handImageRef.current) {
      return
    }

    const imgElement = handImageRef.current
    imgElement.src = handImageSrc // Set src to trigger onload

    imgElement.onload = async () => {
      setHandImageNaturalDimensions({ width: imgElement.naturalWidth, height: imgElement.naturalHeight })
      setIsLoading(true)
      setError(null)
      setStatusMessage("Detecting hand landmarks...")

      try {
        // Use an offscreen canvas for processing to avoid issues with tainted canvas if image is from different origin
        const offscreenCanvas = document.createElement("canvas")
        offscreenCanvas.width = imgElement.naturalWidth
        offscreenCanvas.height = imgElement.naturalHeight
        const ctx = offscreenCanvas.getContext("2d")
        if (!ctx) throw new Error("Could not get canvas context")
        ctx.drawImage(imgElement, 0, 0, imgElement.naturalWidth, imgElement.naturalHeight)

        const results = await processImageWithMediaPipe(offscreenCanvas, mediaPipeHands)
        const allHandsLandmarks = extractAllHandLandmarksPixelCoords(
          results,
          imgElement.naturalWidth,
          imgElement.naturalHeight,
        )

        if (allHandsLandmarks.length > 0) {
          // Assuming the first detected hand
          setDetectedLandmarks(allHandsLandmarks[0])
          setStatusMessage("Hand landmarks detected successfully!")
        } else {
          setError("No hand detected in the image. Please try a different image or angle.")
          setStatusMessage("No hand detected.")
          setDetectedLandmarks(null)
        }
      } catch (err) {
        console.error("Error during hand detection:", err)
        setError(`Hand detection failed: ${(err as Error).message}`)
        setStatusMessage("Error in hand detection.")
      } finally {
        setIsLoading(false)
      }
    }
    imgElement.onerror = () => {
      setError("Failed to load hand image for processing.")
      setStatusMessage("Error loading hand image.")
      setIsLoading(false)
    }
  }, [handImageSrc, mediaPipeHands])

  const targetFingertip = detectedLandmarks?.find((lm) => lm.id === TARGET_FINGER_TIP_LANDMARK_ID) || null
  const targetFingerDip = detectedLandmarks?.find((lm) => lm.id === TARGET_FINGER_DIP_LANDMARK_ID) || null

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-pink-600">Virtual Nail Try-On</h1>
        <p className="text-gray-600">Upload an image of your hand and a nail design to see it virtually applied!</p>
      </header>

      {/* Hidden image element for MediaPipe processing */}
      <img ref={handImageRef} alt="Hand for processing" className="hidden" crossOrigin="anonymous" />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3 p-4 border rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <Hand className="mr-2 h-6 w-6 text-pink-500" /> Step 1: Upload Your Hand
          </h2>
          <Input
            type="file"
            accept="image/*"
            ref={handFileInputRef}
            onChange={handleHandImageUpload}
            className="hidden"
          />
          <Button onClick={() => handFileInputRef.current?.click()} variant="outline" className="w-full">
            <Upload className="mr-2 h-4 w-4" /> Select Hand Image
          </Button>
          {handImageFile && <p className="text-sm text-gray-500">Selected: {handImageFile.name}</p>}
        </div>

        <div className="space-y-3 p-4 border rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-pink-500" /> Step 2: Upload Nail Design
          </h2>
          <Input
            type="file"
            accept="image/png" // Encourage transparent PNGs
            ref={nailFileInputRef}
            onChange={handleNailDesignUpload}
            className="hidden"
          />
          <Button onClick={() => nailFileInputRef.current?.click()} variant="outline" className="w-full">
            <Upload className="mr-2 h-4 w-4" /> Select Nail Design (PNG)
          </Button>
          {nailDesignFile && <p className="text-sm text-gray-500">Selected: {nailDesignFile.name}</p>}
        </div>
      </div>

      {(isLoading || statusMessage) && !error && (
        <Alert>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5 text-blue-500" />}
          <AlertTitle>{isLoading ? "Processing..." : "Status"}</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {handImageSrc && nailDesignSrc && targetFingertip && handImageNaturalDimensions ? (
        <div className="mt-6">
          <Alert variant="default" className="mb-4 border-green-500 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-700">Ready to Try On!</AlertTitle>
            <AlertDescription>
              Adjust the nail design on your hand using the controls. The design is initially placed on your index
              finger.
            </AlertDescription>
          </Alert>
          <FabricTryOnComponent
            handImageSrc={handImageSrc}
            nailDesignSrc={nailDesignSrc}
            targetLandmark={targetFingertip}
            orientationLandmark={targetFingerDip}
            handImageNaturalDimensions={handImageNaturalDimensions}
          />
        </div>
      ) : (
        handImageSrc &&
        !isLoading &&
        !error && (
          <Alert variant="warning" className="mt-6">
            <Wand2 className="h-5 w-5" />
            <AlertTitle>Waiting for all inputs</AlertTitle>
            <AlertDescription>
              {!nailDesignSrc && "Please upload a nail design. "}
              {nailDesignSrc &&
                !targetFingertip &&
                "Could not detect target finger landmarks on the hand image. Try another hand image."}
            </AlertDescription>
          </Alert>
        )
      )}
    </div>
  )
}

export default VirtualTryOnPage
