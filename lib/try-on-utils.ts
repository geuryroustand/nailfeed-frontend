// ===================================================================================
// CRITICAL ADVISORY FOR MEDIAPIPE INTEGRATION:
//
// To prevent browser errors like "require('fs') is not defined" or "__dirname is not defined":
//
// 1. DO NOT add any direct `import ... from '@mediapipe/hands'`,
//    `@mediapipe/camera_utils'`, or any other '@mediapipe/*' packages
//    AT THE TOP OF THIS FILE or any other client-side file that's part of this feature's bundle.
//
// 2. This file loads MediaPipe Hands PURELY from a CDN. The presence of npm packages
//    `@mediapipe/hands` or `@mediapipe/camera_utils` in your `node_modules` (due to `npm install`)
//    can cause your bundler (Webpack/Turbopack) to mistakenly include their Node.js-specific
//    code if it sees an `import` statement for them anywhere in your client bundle.
//
// 3. If you are still getting errors related to 'fs' or '__dirname', you MUST thoroughly
//    search your ENTIRE PROJECT for any such `import` statements in your client-side code
//    and remove or conditionally load them.
//
// This utility is designed to be self-contained for CDN loading of MediaPipe Hands.
// ===================================================================================

interface NailPosition {
  x: number
  y: number
  width: number
  height: number
  angle: number
  centerX: number
  centerY: number
}

let handsModuleInstance: any = null // Renamed to avoid potential conflict with global "handsModule" if any
let mediaPipeInitializationPromise: Promise<boolean> | null = null

const CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915"

async function initMediaPipe(): Promise<boolean> {
  if (typeof window === "undefined") {
    console.warn("MediaPipe initialization skipped: Not in browser environment.")
    return false
  }

  if (handsModuleInstance) {
    console.log("MediaPipe Hands already initialized.")
    return true
  }

  if (mediaPipeInitializationPromise) {
    console.log("MediaPipe Hands initialization in progress...")
    return mediaPipeInitializationPromise
  }

  mediaPipeInitializationPromise = (async () => {
    try {
      // Check if the script is already on the page using bracket notation for window property
      if (!(window as any)["Hands"]) {
        console.log(`Loading MediaPipe Hands script from CDN: ${CDN_URL}/hands.min.js`)
        const script = document.createElement("script")
        script.src = `${CDN_URL}/hands.min.js`
        script.async = true
        script.crossOrigin = "anonymous"

        await new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log("MediaPipe Hands script loaded successfully from CDN.")
            resolve()
          }
          script.onerror = (e) => {
            console.error("Failed to load MediaPipe Hands script from CDN:", e)
            reject(new Error("Failed to load MediaPipe Hands script from CDN."))
          }
          document.head.appendChild(script)
        })
        // Brief pause to allow the browser to process the loaded script
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      // Access window.Hands using bracket notation to prevent bundler interference
      const HandsClass = (window as any)["Hands"]

      if (!HandsClass) {
        throw new Error(
          "MediaPipe Hands class ('window.Hands') not found after script load. Check CDN integrity and network.",
        )
      }

      console.log("Initializing MediaPipe Hands module from CDN version...")
      const localHandsInstance = new HandsClass({
        locateFile: (file: string) => `${CDN_URL}/${file}`,
      })

      localHandsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      })

      // Warm up the model by sending a dummy canvas.
      // This helps ensure model files are fetched if not already cached.
      const dummyCanvas = document.createElement("canvas")
      dummyCanvas.width = 1
      dummyCanvas.height = 1
      await new Promise<void>((resolve, reject) => {
        let resolved = false
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            console.warn("MediaPipe warm-up timed out. Proceeding, but model loading might be slow.")
            resolve() // Resolve to not block indefinitely
          }
        }, 3000) // 3 second timeout for warm-up

        localHandsInstance.onResults((results: any) => {
          if (!resolved) {
            resolved = true
            clearTimeout(timeoutId)
            resolve()
          }
        })
        localHandsInstance.send({ image: dummyCanvas })
      })

      handsModuleInstance = localHandsInstance
      console.log("MediaPipe Hands module (CDN version) initialized successfully.")
      return true
    } catch (err) {
      console.error("Error initializing MediaPipe Hands (CDN version):", err)
      handsModuleInstance = null
      return false
    } finally {
      mediaPipeInitializationPromise = null
    }
  })()
  return mediaPipeInitializationPromise
}

async function processImageWithMediaPipe(canvas: HTMLCanvasElement): Promise<any> {
  if (!handsModuleInstance) {
    throw new Error("MediaPipe Hands (CDN version) not initialized.")
  }
  console.log("Processing image with MediaPipe (CDN version)...")
  return new Promise((resolve) => {
    handsModuleInstance.onResults(resolve) // onResults is persistent, will call back
    handsModuleInstance.send({ image: canvas })
  })
}

function extractNailPositionsFromLandmarks(landmarks: any[], imageWidth: number, imageHeight: number): NailPosition[] {
  const nailPositions: NailPosition[] = []
  const FINGER_TIPS_INDICES = [4, 8, 12, 16, 20]
  const FINGER_PIP_INDICES = [3, 6, 10, 14, 18]
  const FINGER_DIP_INDICES = [null, 7, 11, 15, 19] // DIP for Index, Middle, Ring, Pinky

  for (let i = 0; i < FINGER_TIPS_INDICES.length; i++) {
    const tipIndex = FINGER_TIPS_INDICES[i]
    const pipIndex = FINGER_PIP_INDICES[i]
    const dipIndex = FINGER_DIP_INDICES[i]

    // Ensure landmarks exist
    if (!landmarks[tipIndex] || !landmarks[pipIndex] || (dipIndex !== null && !landmarks[dipIndex])) {
      console.warn(`Skipping finger ${i} due to missing landmarks.`)
      continue
    }

    const tip = { x: landmarks[tipIndex].x * imageWidth, y: landmarks[tipIndex].y * imageHeight }
    const pip = { x: landmarks[pipIndex].x * imageWidth, y: landmarks[pipIndex].y * imageHeight }

    let referenceJointForAngle = pip
    let referenceJointForLength =
      dipIndex !== null ? { x: landmarks[dipIndex].x * imageWidth, y: landmarks[dipIndex].y * imageHeight } : pip

    if (i === 0) {
      // Thumb specific logic
      if (!landmarks[3]) {
        // IP joint for thumb
        console.warn("Skipping thumb due to missing IP landmark (3).")
        continue
      }
      referenceJointForAngle = { x: landmarks[3].x * imageWidth, y: landmarks[3].y * imageHeight }
      referenceJointForLength = referenceJointForAngle
    }

    const angleRad = Math.atan2(tip.y - referenceJointForAngle.y, tip.x - referenceJointForAngle.x)
    const angleDeg = angleRad * (180 / Math.PI) + 90 // +90 because nail designs are typically vertical

    const distalSegmentLength = Math.hypot(tip.x - referenceJointForLength.x, tip.y - referenceJointForLength.y)
    const nailHeight = distalSegmentLength * 0.6 // Nail is a portion of the last segment
    const nailWidth = nailHeight * 0.8 // Maintain an aspect ratio

    const centerX = tip.x
    const centerY = tip.y

    nailPositions.push({
      x: -nailWidth / 2, // Relative to centerX for drawing
      y: -nailHeight / 2, // Relative to centerY for drawing
      width: nailWidth,
      height: nailHeight,
      angle: angleDeg,
      centerX: centerX,
      centerY: centerY,
    })
  }
  console.log("Extracted nail positions from MediaPipe landmarks:", nailPositions)
  return nailPositions
}

export async function detectHands(imageUrl: string): Promise<NailPosition[]> {
  console.log("Attempting hand detection for image:", imageUrl)
  const mediaPipeReady = await initMediaPipe()

  if (!mediaPipeReady || !handsModuleInstance) {
    console.warn("MediaPipe (CDN version) not ready. Falling back to heuristic detection.")
    return fallbackNailDetection(imageUrl)
  }

  try {
    const canvas = await prepareImageOnCanvas(imageUrl) // Ensure this function is robust
    if (canvas.width === 0 || canvas.height === 0) {
      console.warn("Prepared canvas for MediaPipe has zero dimensions. Falling back.")
      return fallbackNailDetection(imageUrl)
    }
    const results = await processImageWithMediaPipe(canvas)

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      console.log(`MediaPipe (CDN version) detected ${results.multiHandLandmarks.length} hand(s). Using the first one.`)
      return extractNailPositionsFromLandmarks(results.multiHandLandmarks[0], canvas.width, canvas.height)
    } else {
      console.warn("MediaPipe (CDN version): No hands detected. Falling back to heuristic detection.")
      return fallbackNailDetection(imageUrl)
    }
  } catch (error) {
    console.error("Error during MediaPipe (CDN version) hand detection:", error)
    console.log("Falling back to heuristic nail detection due to MediaPipe error.")
    return fallbackNailDetection(imageUrl)
  }
}

async function fallbackNailDetection(imageUrl: string): Promise<NailPosition[]> {
  console.log("Using fallback heuristic nail detection for", imageUrl)
  const img = new Image()
  img.crossOrigin = "anonymous"
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = (e) => reject(new Error(`Fallback: Failed to load image: ${e}`))
      img.src = imageUrl
    })
  } catch (e) {
    console.error(e)
    return [] // Return empty if image fails to load
  }

  const width = img.naturalWidth
  const height = img.naturalHeight
  if (width === 0 || height === 0) {
    console.warn("Fallback detection: Image has zero dimensions.")
    return []
  }

  const nailPositions: NailPosition[] = []
  const numNails = 5
  const nailWidth = width * 0.04
  const nailHeight = nailWidth * 1.5
  const handRegionWidth = width * 0.5
  const startX = (width - handRegionWidth) / 2
  const yPos = height * 0.65

  for (let i = 0; i < numNails; i++) {
    const nailCenterX = startX + (handRegionWidth / numNails) * (i + 0.5)
    let yOffset = 0
    if (i === 0 || i === numNails - 1) yOffset = nailHeight * 0.3
    if (i === 1 || i === numNails - 2) yOffset = nailHeight * 0.1
    const nailCenterY = yPos + yOffset

    nailPositions.push({
      x: -nailWidth / 2,
      y: -nailHeight / 2,
      width: nailWidth,
      height: nailHeight,
      angle: 0,
      centerX: nailCenterX,
      centerY: nailCenterY,
    })
  }
  console.log("Fallback nail positions:", nailPositions)
  return nailPositions
}

export async function extractNailDesign(designImageUrl: string): Promise<HTMLCanvasElement> {
  const img = new Image()
  img.crossOrigin = "anonymous"
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = (e) => reject(new Error(`Failed to load design image: ${e}`))
      img.src = designImageUrl
    })
  } catch (e) {
    console.error(e)
    // Return a fallback canvas or rethrow
    const fallbackCanvas = document.createElement("canvas")
    fallbackCanvas.width = 200
    fallbackCanvas.height = 300
    const ctx = fallbackCanvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "grey"
      ctx.fillRect(0, 0, 200, 300)
      ctx.fillStyle = "red"
      ctx.fillText("Design Load Error", 10, 50)
    }
    return fallbackCanvas
  }

  const size = 200
  const designCanvas = document.createElement("canvas")
  designCanvas.width = size
  designCanvas.height = size * 1.5
  const ctx = designCanvas.getContext("2d")
  if (!ctx) throw new Error("Could not create canvas context for design extraction")

  ctx.beginPath()
  ctx.ellipse(size / 2, (size * 1.5) / 2, size / 2, (size * 1.5) / 2, 0, 0, Math.PI * 2)
  ctx.clip()

  const sourceAspect = img.width / img.height
  const targetAspect = designCanvas.width / designCanvas.height
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height
  if (sourceAspect > targetAspect) {
    sw = img.height * targetAspect
    sx = (img.width - sw) / 2
  } else {
    sh = img.width / targetAspect
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, designCanvas.width, designCanvas.height)
  return designCanvas
}

export async function applyNailDesign(sourceImageUrl: string, designImageUrl: string): Promise<string> {
  const nailPositions = await detectHands(sourceImageUrl)
  const designTemplateCanvas = await extractNailDesign(designImageUrl)

  const sourceImage = new Image()
  sourceImage.crossOrigin = "anonymous"
  try {
    await new Promise((resolve, reject) => {
      sourceImage.onload = resolve
      sourceImage.onerror = (e) => reject(new Error(`Failed to load source hand image: ${e}`))
      sourceImage.src = sourceImageUrl
    })
  } catch (e) {
    console.error(e)
    return sourceImageUrl // Return original if source fails to load
  }

  const outputCanvas = document.createElement("canvas")
  outputCanvas.width = sourceImage.naturalWidth
  outputCanvas.height = sourceImage.naturalHeight
  const ctx = outputCanvas.getContext("2d")
  if (!ctx) throw new Error("Could not get output canvas context")

  ctx.drawImage(sourceImage, 0, 0)

  if (nailPositions.length > 0) {
    console.log(`Applying ${nailPositions.length} nail designs...`)
    for (const nail of nailPositions) {
      ctx.save()
      ctx.translate(nail.centerX, nail.centerY)
      ctx.rotate(nail.angle * (Math.PI / 180))
      ctx.drawImage(designTemplateCanvas, nail.x, nail.y, nail.width, nail.height)
      ctx.restore()
    }
  } else {
    console.log("No nail positions to apply designs to.")
  }

  return outputCanvas.toDataURL("image/png")
}

export function saveImage(dataUrl: string, filename = "nail-design-try-on.png") {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function shareImage(dataUrl: string, title = "My Virtual Nail Design") {
  try {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const file = new File([blob], "nail-design.png", { type: "image/png" })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text: "Check out my virtual nail design try-on!", files: [file] })
      return true
    } else {
      console.log("Web Share API not fully supported or cannot share files, falling back to download.")
      saveImage(dataUrl)
      return false
    }
  } catch (error) {
    console.error("Error sharing image:", error)
    saveImage(dataUrl)
    return false
  }
}

export async function prepareImageOnCanvas(imageSource: string | File): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context for image preparation")
  }

  const img = new Image()
  img.crossOrigin = "anonymous"

  let objectUrl: string | null = null
  if (typeof imageSource !== "string") {
    objectUrl = URL.createObjectURL(imageSource)
  }

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = (err) => reject(new Error(`Failed to load image: ${err}`))
      img.src = objectUrl || (imageSource as string)
    })
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
    }
  }

  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
    console.warn("Image loaded with zero dimensions. Canvas will be empty.")
    // Still return a canvas, but it will be blank or match these zero dimensions
  }

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}
