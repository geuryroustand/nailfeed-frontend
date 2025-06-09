// ===================================================================================
// CRITICAL ADVISORY FOR MEDIAPIPE INTEGRATION (REVISED):
//
// The errors "require('fs') is not defined" or "__dirname is not defined" strongly
// indicate that your project's bundler (Webpack/Turbopack) is incorrectly including
// Node.js-specific code from the '@mediapipe/hands' (or related) npm package
// installed in your 'node_modules'.
//
// THIS FILE IS DESIGNED TO LOAD MEDIAPIPE STRICTLY FROM A CDN.
//
// TO FIX THIS:
// 1. YOU MUST SEARCH YOUR ENTIRE PROJECT (all .ts, .tsx, .js, .jsx files)
//    FOR ANY `import ... from '@mediapipe/hands'`, `@mediapipe/camera_utils'`,
//    or any other `'@mediapipe/*'` statements IN CLIENT-SIDE CODE.
// 2. REMOVE OR REFACTOR these imports. They are the most common cause of this issue.
//    The bundler sees these and pulls in the Node.js version from node_modules.
// 3. If you installed `@mediapipe/camera_utils` or other `@mediapipe/*` packages
//    via npm and they are not strictly needed for server-side operations (unlikely),
//    consider if they can be removed from package.json to prevent accidental bundling,
//    OR ensure they are only imported in server-side specific files if used there.
//
// The changes below attempt to further isolate the CDN-loaded MediaPipe instance,
// but the root cause is likely an external import.
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

// Ensure these are module-scoped and not accidentally re-declared or shadowed.
let handsInstanceFromCDN: any = null
let mediaPipeCDNInitializationPromise: Promise<boolean> | null = null

const MEDIAPIPE_CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915"

async function initMediaPipeFromCDN(): Promise<boolean> {
  if (typeof window === "undefined") {
    console.warn("MediaPipe (CDN) init skipped: Not in browser.")
    return false
  }

  if (handsInstanceFromCDN) {
    console.log("MediaPipe Hands (CDN) already initialized.")
    return true
  }

  if (mediaPipeCDNInitializationPromise) {
    console.log("MediaPipe Hands (CDN) initialization in progress...")
    return mediaPipeCDNInitializationPromise
  }

  mediaPipeCDNInitializationPromise = (async () => {
    try {
      const HandsClassKey = "Hands" // Use a variable for the key
      if (!(window as any)[HandsClassKey]) {
        console.log(`Loading MediaPipe Hands script from CDN: ${MEDIAPIPE_CDN_URL}/hands.min.js`)
        const script = document.createElement("script")
        script.src = `${MEDIAPIPE_CDN_URL}/hands.min.js`
        script.async = true
        script.crossOrigin = "anonymous"
        const scriptLoadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log("MediaPipe Hands script (CDN) loaded successfully.")
            resolve()
          }
          script.onerror = (e) => {
            console.error("Failed to load MediaPipe Hands script (CDN):", e)
            reject(new Error("Failed to load MediaPipe Hands script (CDN)."))
          }
        })
        document.head.appendChild(script)
        await scriptLoadPromise
        await new Promise((resolve) => setTimeout(resolve, 200)) // Increased delay
      }

      const HandsConstructor = (window as any)[HandsClassKey]
      if (!HandsConstructor) {
        throw new Error(`MediaPipe Hands class ('window.${HandsClassKey}') not found after script load.`)
      }

      console.log("Initializing MediaPipe Hands module from CDN constructor...")
      const instance = new HandsConstructor({
        locateFile: (file: string) => `${MEDIAPIPE_CDN_URL}/${file}`,
      })

      instance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      })

      console.log("Warming up MediaPipe (CDN) model...")
      const dummyCanvas = document.createElement("canvas")
      dummyCanvas.width = 1
      dummyCanvas.height = 1
      const warmUpPromise = new Promise<void>((resolve) => {
        let resolved = false
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            console.warn("MediaPipe (CDN) warm-up timed out. Errors might occur if model files are not ready.")
            resolve()
          }
        }, 5000) // Increased timeout

        instance.onResults((results: any) => {
          // Ensure this is the onResults of the CDN instance
          if (!resolved) {
            resolved = true
            clearTimeout(timeoutId)
            console.log("MediaPipe (CDN) warm-up signal received.")
            resolve()
          }
        })
        instance.send({ image: dummyCanvas }) // Ensure this is the send of the CDN instance
      })
      await warmUpPromise

      handsInstanceFromCDN = instance
      console.log("MediaPipe Hands module (CDN version) fully initialized.")
      return true
    } catch (err) {
      console.error("Error initializing MediaPipe Hands (CDN version):", err)
      handsInstanceFromCDN = null
      return false
    } finally {
      mediaPipeCDNInitializationPromise = null
    }
  })()
  return mediaPipeCDNInitializationPromise
}

async function processImageWithCDNHands(canvas: HTMLCanvasElement): Promise<any> {
  if (!handsInstanceFromCDN) {
    // Attempt to re-initialize if not ready, though this might indicate a deeper issue
    console.warn("MediaPipe (CDN) instance not found in processImage. Attempting re-init.")
    const ready = await initMediaPipeFromCDN()
    if (!ready || !handsInstanceFromCDN) {
      throw new Error("MediaPipe Hands (CDN version) could not be initialized for processing.")
    }
  }
  console.log("Processing image with MediaPipe (CDN instance)...")
  return new Promise((resolve, reject) => {
    // Ensure we are calling methods on the correct instance
    const currentHandsInstance = handsInstanceFromCDN
    if (!currentHandsInstance) {
      // Should not happen if init was successful
      reject(new Error("MediaPipe (CDN) instance became null before processing."))
      return
    }
    currentHandsInstance.onResults(resolve)
    currentHandsInstance.send({ image: canvas })
  })
}

function extractNailPositionsFromLandmarks(landmarks: any[], imageWidth: number, imageHeight: number): NailPosition[] {
  // ... (This function's internal logic remains the same as previous correct version)
  const nailPositions: NailPosition[] = []
  const FINGER_TIPS_INDICES = [4, 8, 12, 16, 20]
  const FINGER_PIP_INDICES = [3, 6, 10, 14, 18]
  const FINGER_DIP_INDICES = [null, 7, 11, 15, 19]

  for (let i = 0; i < FINGER_TIPS_INDICES.length; i++) {
    const tipIndex = FINGER_TIPS_INDICES[i]
    const pipIndex = FINGER_PIP_INDICES[i]
    const dipIndex = FINGER_DIP_INDICES[i]

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
      if (!landmarks[3]) {
        console.warn("Skipping thumb due to missing IP landmark (3).")
        continue
      }
      referenceJointForAngle = { x: landmarks[3].x * imageWidth, y: landmarks[3].y * imageHeight }
      referenceJointForLength = referenceJointForAngle
    }

    const angleRad = Math.atan2(tip.y - referenceJointForAngle.y, tip.x - referenceJointForAngle.x)
    const angleDeg = angleRad * (180 / Math.PI) + 90

    const distalSegmentLength = Math.hypot(tip.x - referenceJointForLength.x, tip.y - referenceJointForLength.y)
    const nailHeight = distalSegmentLength * 0.6
    const nailWidth = nailHeight * 0.8

    const centerX = tip.x
    const centerY = tip.y

    nailPositions.push({
      x: -nailWidth / 2,
      y: -nailHeight / 2,
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
  console.log("Attempting hand detection (CDN priority) for image:", imageUrl)
  const mediaPipeReady = await initMediaPipeFromCDN() // Use the renamed init function

  if (!mediaPipeReady || !handsInstanceFromCDN) {
    // Check the renamed instance variable
    console.warn("MediaPipe (CDN version) not ready. Falling back to heuristic detection.")
    return fallbackNailDetection(imageUrl)
  }

  try {
    const canvas = await prepareImageOnCanvas(imageUrl)
    if (canvas.width === 0 || canvas.height === 0) {
      console.warn("Prepared canvas for MediaPipe has zero dimensions. Falling back.")
      return fallbackNailDetection(imageUrl)
    }
    const results = await processImageWithCDNHands(canvas) // Use the renamed process function

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      console.log(`MediaPipe (CDN version) detected ${results.multiHandLandmarks.length} hand(s).`)
      return extractNailPositionsFromLandmarks(results.multiHandLandmarks[0], canvas.width, canvas.height)
    } else {
      console.warn("MediaPipe (CDN version): No hands detected. Falling back.")
      return fallbackNailDetection(imageUrl)
    }
  } catch (error) {
    console.error("Error during MediaPipe (CDN version) hand detection:", error)
    return fallbackNailDetection(imageUrl)
  }
}

// Fallback, extractNailDesign, applyNailDesign, saveImage, shareImage, prepareImageOnCanvas
// functions remain largely the same as the previous correct version.
// Ensure they don't introduce any MediaPipe imports.

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
    return []
  }
  const width = img.naturalWidth,
    height = img.naturalHeight
  if (width === 0 || height === 0) {
    console.warn("Fallback detection: Image has zero dimensions.")
    return []
  }
  const nailPositions: NailPosition[] = []
  const numNails = 5
  const nailWidth = width * 0.04,
    nailHeight = nailWidth * 1.5
  const handRegionWidth = width * 0.5,
    startX = (width - handRegionWidth) / 2
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
    const fb = document.createElement("canvas")
    fb.width = 200
    fb.height = 300
    const c = fb.getContext("2d")
    if (c) {
      c.fillStyle = "gray"
      c.fillRect(0, 0, 200, 300)
      c.fillStyle = "red"
      c.fillText("Error", 10, 50)
    }
    return fb
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
  const sourceAspect = img.width / img.height,
    targetAspect = designCanvas.width / designCanvas.height
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
    return sourceImageUrl
  }
  const outputCanvas = document.createElement("canvas")
  outputCanvas.width = sourceImage.naturalWidth
  outputCanvas.height = sourceImage.naturalHeight
  const ctx = outputCanvas.getContext("2d")
  if (!ctx) throw new Error("Could not get output canvas context")
  ctx.drawImage(sourceImage, 0, 0)
  if (nailPositions.length > 0) {
    for (const nail of nailPositions) {
      ctx.save()
      ctx.translate(nail.centerX, nail.centerY)
      ctx.rotate(nail.angle * (Math.PI / 180))
      ctx.drawImage(designTemplateCanvas, nail.x, nail.y, nail.width, nail.height)
      ctx.restore()
    }
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
    }
  } catch (error) {
    console.error("Error sharing image:", error)
  }
  saveImage(dataUrl)
  return false
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
    console.warn("Image loaded with zero dimensions.")
  }
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}
