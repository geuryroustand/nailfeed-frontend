// lib/try-on-utils.ts

interface NailPosition {
  x: number // Top-left x of the bounding box before rotation
  y: number // Top-left y of the bounding box before rotation
  width: number
  height: number
  angle: number // Angle in degrees for rotation around the nail's center
  centerX: number // Center X for rotation
  centerY: number // Center Y for rotation
}

let handsModule: any = null
let mediaPipeInitializationPromise: Promise<boolean> | null = null

const CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915" // Specific version for stability

async function initMediaPipe(): Promise<boolean> {
  if (typeof window === "undefined") {
    console.warn("MediaPipe initialization skipped: Not in browser environment")
    return false
  }

  if (handsModule) {
    console.log("MediaPipe Hands already initialized.")
    return true
  }

  if (mediaPipeInitializationPromise) {
    console.log("MediaPipe Hands initialization in progress...")
    return mediaPipeInitializationPromise
  }

  mediaPipeInitializationPromise = (async () => {
    try {
      console.log("Starting MediaPipe Hands initialization...")
      if (!(window as any).Hands) {
        console.log(`Loading MediaPipe Hands script from CDN: ${CDN_URL}/hands.min.js`)
        const script = document.createElement("script")
        script.src = `${CDN_URL}/hands.min.js`
        script.async = true
        script.crossOrigin = "anonymous"

        await new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log("MediaPipe Hands script loaded successfully.")
            resolve()
          }
          script.onerror = (e) => {
            console.error("Failed to load MediaPipe Hands script:", e)
            reject(new Error("Failed to load MediaPipe Hands script"))
          }
          document.head.appendChild(script)
        })
        // Small delay to ensure the script is fully processed by the browser
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (!(window as any).Hands) {
        throw new Error("MediaPipe Hands not available on window object after script load.")
      }

      const Hands = (window as any).Hands
      handsModule = new Hands({
        locateFile: (file: string) => `${CDN_URL}/${file}`,
      })

      handsModule.setOptions({
        maxNumHands: 1, // Detect a maximum of one hand
        modelComplexity: 1, // 0 or 1. Higher is more accurate but slower.
        minDetectionConfidence: 0.7, // Minimum confidence value for hand detection
        minTrackingConfidence: 0.5,
      })

      // Perform a dummy send to ensure the model files are loaded.
      // This can take a moment on first run.
      const dummyCanvas = document.createElement("canvas")
      dummyCanvas.width = 1
      dummyCanvas.height = 1
      await new Promise<void>((resolve) => {
        handsModule.onResults(() => resolve()) // Resolve on first result (even if empty)
        handsModule.send({ image: dummyCanvas })
      })

      console.log("MediaPipe Hands module initialized and configured successfully.")
      return true
    } catch (err) {
      console.error("Error initializing MediaPipe Hands:", err)
      handsModule = null // Reset on failure
      return false
    } finally {
      mediaPipeInitializationPromise = null // Clear the promise once settled
    }
  })()
  return mediaPipeInitializationPromise
}

async function processImageWithMediaPipe(canvas: HTMLCanvasElement): Promise<any> {
  if (!handsModule) {
    throw new Error("MediaPipe Hands not initialized. Call initMediaPipe first.")
  }
  console.log("Sending image to MediaPipe for processing...")
  return new Promise((resolve) => {
    handsModule.onResults((results: any) => {
      resolve(results)
    })
    handsModule.send({ image: canvas })
  })
}

function extractNailPositionsFromLandmarks(landmarks: any[], imageWidth: number, imageHeight: number): NailPosition[] {
  const nailPositions: NailPosition[] = []

  // Landmark indices for fingertips and relevant joints
  const FINGER_TIPS_INDICES = [4, 8, 12, 16, 20] // Thumb, Index, Middle, Ring, Pinky
  const FINGER_PIP_INDICES = [3, 6, 10, 14, 18] // PIP for Thumb (IP), Index, Middle, Ring, Pinky
  const FINGER_DIP_INDICES = [null, 7, 11, 15, 19] // DIP for Index, Middle, Ring, Pinky (Thumb has no DIP in this context)
  // For thumb, PIP (landmark 3) acts like DIP for length calculation.
  // MCP for thumb is landmark 2.

  for (let i = 0; i < FINGER_TIPS_INDICES.length; i++) {
    const tipIndex = FINGER_TIPS_INDICES[i]
    const pipIndex = FINGER_PIP_INDICES[i]
    const dipIndex = FINGER_DIP_INDICES[i]

    const tip = {
      x: landmarks[tipIndex].x * imageWidth,
      y: landmarks[tipIndex].y * imageHeight,
      z: landmarks[tipIndex].z,
    }
    const pip = {
      x: landmarks[pipIndex].x * imageWidth,
      y: landmarks[pipIndex].y * imageHeight,
    }

    // Use PIP for thumb's "DIP" equivalent for length calculation
    const dipOrEquivalent =
      dipIndex !== null
        ? {
            x: landmarks[dipIndex].x * imageWidth,
            y: landmarks[dipIndex].y * imageHeight,
          }
        : pip // For thumb, use PIP as the reference joint for length.
    // More accurately for thumb, use landmark 2 (MCP) and 3 (IP) for orientation and landmark 3 (IP) and 4 (TIP) for length.
    // Let's adjust for thumb specifically.

    let referenceJointForAngle = pip
    let referenceJointForLength = dipOrEquivalent

    if (i === 0) {
      // Thumb
      const mcpThumb = { x: landmarks[2].x * imageWidth, y: landmarks[2].y * imageHeight }
      referenceJointForAngle = { x: landmarks[3].x * imageWidth, y: landmarks[3].y * imageHeight } // IP joint for thumb angle
      referenceJointForLength = referenceJointForAngle // IP joint for thumb length calculation relative to tip
    }

    // Calculate angle of the finger (distal segment)
    const angleRad = Math.atan2(tip.y - referenceJointForAngle.y, tip.x - referenceJointForAngle.x)
    const angleDeg = angleRad * (180 / Math.PI) + 90 // +90 because nail design is typically vertical

    // Calculate nail height (length along the finger)
    // Distance between tip and DIP (or PIP for thumb)
    const dyLength = tip.y - referenceJointForLength.y
    const dxLength = tip.x - referenceJointForLength.x
    const distalSegmentLength = Math.sqrt(dxLength * dxLength + dyLength * dyLength)
    const nailHeight = distalSegmentLength * 0.6 // Nail is a portion of the last segment

    // Calculate nail width (perpendicular to finger length)
    const nailWidth = nailHeight * 0.8 // Maintain an aspect ratio

    // Position the nail centered at the tip landmark
    const centerX = tip.x
    const centerY = tip.y

    // The (x,y) for drawImage should be top-left of the unrotated nail image,
    // then translation and rotation happens around centerX, centerY.
    // So, x and y are calculated as if the nail's center is (0,0) relative to its own coordinate system.
    const nailX = -nailWidth / 2
    const nailY = -nailHeight / 2

    nailPositions.push({
      x: nailX, // Relative to centerX for drawing
      y: nailY, // Relative to centerY for drawing
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
  console.log("Attempting hand detection with MediaPipe for image:", imageUrl)
  const mediaPipeReady = await initMediaPipe()

  if (!mediaPipeReady || !handsModule) {
    console.warn("MediaPipe not ready or failed to initialize. Falling back to heuristic detection.")
    return fallbackNailDetection(imageUrl)
  }

  try {
    const imageElement = new Image()
    imageElement.crossOrigin = "anonymous"
    await new Promise((resolve, reject) => {
      imageElement.onload = resolve
      imageElement.onerror = (e) => {
        console.error("Failed to load image for MediaPipe:", e)
        reject(new Error("Image load failed for MediaPipe"))
      }
      imageElement.src = imageUrl
    })

    const canvas = document.createElement("canvas")
    canvas.width = imageElement.naturalWidth
    canvas.height = imageElement.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get canvas context for MediaPipe input")
    ctx.drawImage(imageElement, 0, 0)

    const results = await processImageWithMediaPipe(canvas)

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Assuming results.multiHandLandmarks[0] contains the landmarks for the first detected hand
      console.log(`MediaPipe detected ${results.multiHandLandmarks.length} hand(s). Using the first one.`)
      return extractNailPositionsFromLandmarks(results.multiHandLandmarks[0], canvas.width, canvas.height)
    } else {
      console.warn("MediaPipe: No hands detected. Falling back to heuristic detection.")
      return fallbackNailDetection(imageUrl)
    }
  } catch (error) {
    console.error("Error during MediaPipe hand detection:", error)
    console.log("Falling back to heuristic nail detection due to MediaPipe error.")
    return fallbackNailDetection(imageUrl)
  }
}

// Fallback detection (simplified heuristic)
async function fallbackNailDetection(imageUrl: string): Promise<NailPosition[]> {
  console.log("Using fallback heuristic nail detection for", imageUrl)
  const img = new Image()
  img.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    img.onload = () => resolve(null)
    img.onerror = (e) => reject(new Error(`Fallback: Failed to load image: ${e}`))
    img.src = imageUrl
  })

  const width = img.naturalWidth
  const height = img.naturalHeight
  if (width === 0 || height === 0) return []

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
      x: -nailWidth / 2, // Relative to centerX
      y: -nailHeight / 2, // Relative to centerY
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
  // This function remains largely the same as it's about processing the design image.
  const img = new Image()
  img.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = (e) => reject(new Error(`Failed to load design image: ${e}`))
    img.src = designImageUrl
  })

  const size = 200 // Output size for the nail design template
  const designCanvas = document.createElement("canvas")
  designCanvas.width = size
  designCanvas.height = size * 1.5 // Typical nail aspect ratio
  const ctx = designCanvas.getContext("2d")
  if (!ctx) throw new Error("Could not create canvas context for design extraction")

  ctx.clearRect(0, 0, designCanvas.width, designCanvas.height)
  // Create an oval clipping path for a more nail-like shape
  ctx.beginPath()
  ctx.ellipse(size / 2, (size * 1.5) / 2, size / 2, (size * 1.5) / 2, 0, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  // Draw the source design image, fitting it into the oval
  const sourceAspect = img.width / img.height
  const targetAspect = designCanvas.width / designCanvas.height
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height

  if (sourceAspect > targetAspect) {
    // Source is wider
    sw = img.height * targetAspect
    sx = (img.width - sw) / 2
  } else {
    // Source is taller or same aspect
    sh = img.width / targetAspect
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, designCanvas.width, designCanvas.height)
  return designCanvas
}

export async function applyNailDesign(sourceImageUrl: string, designImageUrl: string): Promise<string> {
  console.log("Applying nail design. Source:", sourceImageUrl, "Design:", designImageUrl)
  const nailPositions = await detectHands(sourceImageUrl) // This now tries MediaPipe first

  if (nailPositions.length === 0) {
    console.warn("No nail positions detected by MediaPipe or fallback. Returning original image.")
    // To avoid errors, you might return the original image or a specific error indicator.
    // For now, let's attempt to draw on a blank canvas if source image load fails later.
  }

  const designTemplateCanvas = await extractNailDesign(designImageUrl)

  const sourceImage = new Image()
  sourceImage.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    sourceImage.onload = resolve
    sourceImage.onerror = (e) => reject(new Error(`Failed to load source hand image: ${e}`))
    sourceImage.src = sourceImageUrl
  })

  const outputCanvas = document.createElement("canvas")
  outputCanvas.width = sourceImage.naturalWidth
  outputCanvas.height = sourceImage.naturalHeight
  const ctx = outputCanvas.getContext("2d")
  if (!ctx) throw new Error("Could not get output canvas context")

  ctx.drawImage(sourceImage, 0, 0) // Draw the hand image first

  if (nailPositions.length > 0) {
    console.log(`Applying ${nailPositions.length} nail designs...`)
    for (const nail of nailPositions) {
      ctx.save()
      // Translate to the nail's designated center for rotation
      ctx.translate(nail.centerX, nail.centerY)
      ctx.rotate(nail.angle * (Math.PI / 180))
      // Draw the design. nail.x and nail.y are relative to its center.
      ctx.drawImage(
        designTemplateCanvas,
        nail.x, // This is -nail.width / 2
        nail.y, // This is -nail.height / 2
        nail.width,
        nail.height,
      )
      ctx.restore()
      // Optionally, re-apply shine effect if desired, adjusting its position based on nail.centerX, nail.centerY
      // applyShineEffect(ctx, nail.centerX - nail.width/2, nail.centerY - nail.height/2, nail.width, nail.height, nail.angle);
    }
  } else {
    console.log("No nail positions to apply designs to.")
  }

  return outputCanvas.toDataURL("image/png")
}

// Shine effect (can be kept or removed based on preference)
function applyShineEffect(
  ctx: CanvasRenderingContext2D,
  x: number, // Top-left x of the nail before rotation
  y: number, // Top-left y of the nail before rotation
  width: number,
  height: number,
  angle: number, // Angle in degrees
) {
  ctx.save()
  // Translate to the center of the nail for rotation, then rotate, then draw relative to that center
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate(angle * (Math.PI / 180))

  // Draw shine relative to the nail's local coordinates (0,0 at its center)
  const gradient = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2)
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)")
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)")
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2) // Centered at (0,0)
  ctx.fill()
  ctx.restore()
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
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [new File([blob], "nail-design.png", { type: "image/png" })] })
    ) {
      await navigator.share({
        title: title,
        text: "Check out my virtual nail design try-on!",
        files: [new File([blob], "nail-design.png", { type: "image/png" })],
      })
      return true
    } else {
      console.log("Web Share API not supported or cannot share files, falling back to download.")
      saveImage(dataUrl)
      return false
    }
  } catch (error) {
    console.error("Error sharing image:", error)
    saveImage(dataUrl) // Fallback to download on error
    return false
  }
}

// This function is a general utility for preparing an image on a canvas.
// Renamed to be more generic as it's not exclusively for MediaPipe anymore.
export async function prepareImageOnCanvas(imageSource: string | File): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  const img = new Image()
  img.crossOrigin = "anonymous" // Important for processing images from other origins

  if (typeof imageSource === "string") {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = (e) => reject(new Error(`Failed to load image from URL: ${e}`))
      img.src = imageSource
    })
  } else {
    // imageSource is a File object
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        URL.revokeObjectURL(img.src) // Clean up object URL after load
        resolve()
      }
      img.onerror = (e) => {
        URL.revokeObjectURL(img.src) // Clean up on error too
        reject(new Error(`Failed to load image from File: ${e}`))
      }
      img.src = URL.createObjectURL(imageSource)
    })
  }

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}
