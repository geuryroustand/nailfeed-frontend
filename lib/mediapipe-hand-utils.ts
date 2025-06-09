// @ts-nocheck - This is to suppress TypeScript errors for the MediaPipe Hands library
// as it's typically loaded via CDN and may not have perfect type definitions.

interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface PixelCoordinate {
  id: number
  x: number
  y: number
}

// Fingertip landmark indices in MediaPipe Hands
// const FINGERTIP_LANDMARK_INDICES = [4, 8, 12, 16, 20] // THUMB_TIP, INDEX_FINGER_TIP, MIDDLE_FINGER_TIP, RING_FINGER_TIP, PINKY_TIP

let handsInstance: any = null

export async function initMediaPipeHands(): Promise<any> {
  if (typeof window === "undefined") {
    console.warn("MediaPipe initialization skipped: Not in browser environment")
    return null
  }

  if (handsInstance) {
    console.log("MediaPipe Hands already initialized.")
    return handsInstance
  }

  try {
    console.log("Attempting to load MediaPipe Hands script...")
    if (!(window as any).Hands) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js"
      script.async = true
      script.crossOrigin = "anonymous"

      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          console.log("MediaPipe Hands script loaded successfully.")
          resolve()
        }
        script.onerror = (e) => {
          console.error("Failed to load MediaPipe Hands script:", e)
          reject(new Error("Failed to load MediaPipe Hands script."))
        }
        document.head.appendChild(script)
      })
      // Small delay to ensure the script is fully processed by the browser
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (!(window as any).Hands) {
      throw new Error("MediaPipe Hands not available on window object after script load.")
    }

    console.log("Initializing MediaPipe Hands instance...")
    const Hands = (window as any).Hands
    handsInstance = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
    })

    handsInstance.setOptions({
      maxNumHands: 1, // Detect one hand for simplicity
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    await handsInstance.initialize()
    console.log("MediaPipe Hands initialized successfully.")
    return handsInstance
  } catch (error) {
    console.error("Error initializing MediaPipe Hands:", error)
    handsInstance = null // Reset on failure
    throw error // Re-throw to be caught by caller
  }
}

export async function processImageWithMediaPipe(
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  hands: any,
): Promise<any> {
  if (!hands) {
    throw new Error("MediaPipe Hands instance is not initialized.")
  }
  return new Promise((resolve) => {
    hands.onResults(resolve)
    hands.send({ image: imageSource })
  })
}

export function extractAllHandLandmarksPixelCoords(
  results: any,
  imageWidth: number,
  imageHeight: number,
): PixelCoordinate[][] {
  const allHandsPixelLandmarks: PixelCoordinate[][] = []
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const handLandmarks of results.multiHandLandmarks) {
      const singleHandPixelLandmarks: PixelCoordinate[] = []
      handLandmarks.forEach((landmark: Landmark, index: number) => {
        singleHandPixelLandmarks.push({
          id: index,
          x: landmark.x * imageWidth,
          y: landmark.y * imageHeight,
        })
      })
      allHandsPixelLandmarks.push(singleHandPixelLandmarks)
    }
  }
  return allHandsPixelLandmarks
}
