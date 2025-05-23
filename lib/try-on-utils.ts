// Utility functions for the try-on feature

// Flag to track if MediaPipe is loaded
let isMediaPipeLoaded = false
let isMediaPipeLoading = false
let mediapiPeLoadPromise: Promise<void> | null = null

// Function to dynamically load the MediaPipe Hands library
export async function initMediaPipe(): Promise<void> {
  // If already loaded, return immediately
  if (isMediaPipeLoaded) {
    return Promise.resolve()
  }

  // If currently loading, return the existing promise
  if (isMediaPipeLoading && mediapiPeLoadPromise) {
    return mediapiPeLoadPromise
  }

  // Start loading
  isMediaPipeLoading = true

  // Create a promise that will resolve when loading is complete
  mediapiPeLoadPromise = new Promise<void>((resolve, reject) => {
    try {
      // Check if the script is already in the document
      if (document.querySelector('script[src*="hands.js"]')) {
        console.log("MediaPipe script already exists in the document")

        // Check if the global Hands object exists
        if (typeof window.Hands !== "undefined") {
          console.log("MediaPipe Hands is already loaded")
          isMediaPipeLoaded = true
          resolve()
          return
        }
      }

      // Create script element
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
      script.async = true

      // Set up event handlers
      script.onload = () => {
        console.log("MediaPipe script loaded successfully")

        // Check if the global Hands object exists
        if (typeof window.Hands !== "undefined") {
          console.log("MediaPipe Hands is available")
          isMediaPipeLoaded = true
          resolve()
        } else {
          // If the script loaded but the global object isn't available, wait a bit
          console.log("MediaPipe script loaded but Hands object not available yet, waiting...")
          setTimeout(() => {
            if (typeof window.Hands !== "undefined") {
              console.log("MediaPipe Hands is now available after waiting")
              isMediaPipeLoaded = true
              resolve()
            } else {
              const error = new Error("MediaPipe Hands object not available after script load")
              console.error(error)
              reject(error)
            }
          }, 1000)
        }
      }

      script.onerror = (error) => {
        console.error("Error loading MediaPipe script:", error)
        isMediaPipeLoading = false
        mediapiPeLoadPromise = null
        reject(new Error("Failed to load MediaPipe script"))
      }

      // Add the script to the document
      document.body.appendChild(script)
      console.log("MediaPipe script added to document")
    } catch (error) {
      console.error("Error in initMediaPipe:", error)
      isMediaPipeLoading = false
      mediapiPeLoadPromise = null
      reject(error)
    }
  })

  return mediapiPeLoadPromise
}

// Function to create a Hands instance
export async function createHandsDetector(): Promise<any> {
  try {
    // Ensure MediaPipe is loaded
    await initMediaPipe()

    // Check if the global Hands constructor is available
    if (typeof window.Hands === "undefined") {
      throw new Error("MediaPipe Hands is not available")
    }

    // Create a new Hands instance
    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      },
    })

    // Configure the model
    await hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    return hands
  } catch (error) {
    console.error("Error creating hands detector:", error)
    throw error
  }
}

// Function to detect hand landmarks in an image
export async function detectHands(imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<any> {
  try {
    const hands = await createHandsDetector()

    // Create a canvas to process the image
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Set canvas dimensions to match the image
    canvas.width = imageSource.width || 640
    canvas.height = imageSource.height || 480

    // Draw the image onto the canvas
    ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height)

    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Process the image with MediaPipe
    const results = await hands.process(imageData)

    return results
  } catch (error) {
    console.error("Error detecting hands:", error)
    throw error
  }
}

// Function to apply nail design to fingers
export function applyNailDesign(canvas: HTMLCanvasElement, handLandmarks: any[], designImage: HTMLImageElement): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // For each hand
  handLandmarks.forEach((landmarks) => {
    // Finger tip indices in MediaPipe Hands model
    const fingertips = [4, 8, 12, 16, 20] // thumb, index, middle, ring, pinky

    // For each fingertip
    fingertips.forEach((tipIndex) => {
      // Get the fingertip position
      const tip = landmarks[tipIndex]
      const x = tip.x * canvas.width
      const y = tip.y * canvas.height

      // Get the previous joint position to calculate nail orientation
      const prevJoint = landmarks[tipIndex - 1]
      const prevX = prevJoint.x * canvas.width
      const prevY = prevJoint.y * canvas.height

      // Calculate angle for rotation
      const angle = Math.atan2(y - prevY, x - prevX) - Math.PI / 2

      // Calculate nail size (adjust as needed)
      const nailWidth = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2)) * 1.5
      const nailHeight = nailWidth * 0.8

      // Save context state
      ctx.save()

      // Translate to fingertip position
      ctx.translate(x, y)

      // Rotate to match finger orientation
      ctx.rotate(angle)

      // Draw the design on the nail
      ctx.drawImage(designImage, -nailWidth / 2, -nailHeight / 2, nailWidth, nailHeight)

      // Restore context state
      ctx.restore()
    })
  })
}

// Function to save the result image
export function saveImage(dataUrl: string): void {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = `nail-design-${new Date().getTime()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Function to share the result image
export async function shareImage(dataUrl: string): Promise<boolean> {
  try {
    // Check if Web Share API is available
    if (navigator.share) {
      // Convert data URL to Blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      // Create a File from the Blob
      const file = new File([blob], "nail-design.png", { type: "image/png" })

      // Share the file
      await navigator.share({
        title: "My Nail Design",
        text: "Check out my virtual nail design!",
        files: [file],
      })

      return true
    }

    // Web Share API not available
    return false
  } catch (error) {
    console.error("Error sharing image:", error)
    return false
  }
}

// Add a type declaration for the global Hands constructor
declare global {
  interface Window {
    Hands: any
  }
}
