// IMPORTANT: Do not add any direct imports from '@mediapipe/hands'
// or other mediapipe packages here. Doing so will cause the bundler
// to include Node.js-specific code, leading to browser errors.
// We are loading the browser-compatible version from a CDN instead.

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

const CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915"

async function initMediaPipe(): Promise<boolean> {
  if (typeof window === "undefined") {
    console.warn("MediaPipe initialization skipped: Not in browser environment")
    return false
  }

  if (handsModule) {
    return true
  }

  if (mediaPipeInitializationPromise) {
    return mediaPipeInitializationPromise
  }

  mediaPipeInitializationPromise = (async () => {
    try {
      // Check if the script is already on the page
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
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Use bracket notation to access window.Hands. This prevents bundlers
      // from trying to statically resolve the 'Hands' symbol to the npm package.
      const HandsClass = (window as any)["Hands"]

      if (!HandsClass) {
        throw new Error("MediaPipe Hands class not found on window object after script load.")
      }

      console.log("Initializing MediaPipe Hands module...")
      handsModule = new HandsClass({
        locateFile: (file: string) => `${CDN_URL}/${file}`,
      })

      handsModule.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      })

      // Warm up the model
      await new Promise<void>((resolve) => {
        handsModule.onResults(() => resolve())
        handsModule.send({ image: document.createElement("canvas") })
      })

      console.log("MediaPipe Hands module initialized successfully.")
      return true
    } catch (err) {
      console.error("Error initializing MediaPipe Hands:", err)
      handsModule = null
      return false
    } finally {
      mediaPipeInitializationPromise = null
    }
  })()
  return mediaPipeInitializationPromise
}

async function processImageWithMediaPipe(canvas: HTMLCanvasElement): Promise<any> {
  if (!handsModule) {
    throw new Error("MediaPipe Hands not initialized.")
  }
  return new Promise((resolve) => {
    handsModule.onResults(resolve)
    handsModule.send({ image: canvas })
  })
}

function extractNailPositionsFromLandmarks(landmarks: any[], imageWidth: number, imageHeight: number): NailPosition[] {
  const nailPositions: NailPosition[] = []
  const FINGER_TIPS_INDICES = [4, 8, 12, 16, 20]
  const FINGER_PIP_INDICES = [3, 6, 10, 14, 18]
  const FINGER_DIP_INDICES = [null, 7, 11, 15, 19]

  for (let i = 0; i < FINGER_TIPS_INDICES.length; i++) {
    const tipIndex = FINGER_TIPS_INDICES[i]
    const pipIndex = FINGER_PIP_INDICES[i]
    const dipIndex = FINGER_DIP_INDICES[i]

    const tip = { x: landmarks[tipIndex].x * imageWidth, y: landmarks[tipIndex].y * imageHeight }
    const pip = { x: landmarks[pipIndex].x * imageWidth, y: landmarks[pipIndex].y * imageHeight }

    let referenceJointForAngle = pip
    let referenceJointForLength =
      dipIndex !== null ? { x: landmarks[dipIndex].x * imageWidth, y: landmarks[dipIndex].y * imageHeight } : pip

    if (i === 0) {
      // Thumb specific logic
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
  return nailPositions
}

export async function detectHands(imageUrl: string): Promise<NailPosition[]> {
  const mediaPipeReady = await initMediaPipe()

  if (!mediaPipeReady) {
    console.warn("MediaPipe not ready. Falling back to heuristic detection.")
    return fallbackNailDetection(imageUrl)
  }

  try {
    const canvas = await prepareImageOnCanvas(imageUrl)
    const results = await processImageWithMediaPipe(canvas)

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      console.log(`MediaPipe detected ${results.multiHandLandmarks.length} hand(s).`)
      return extractNailPositionsFromLandmarks(results.multiHandLandmarks[0], canvas.width, canvas.height)
    } else {
      console.warn("MediaPipe: No hands detected. Falling back.")
      return fallbackNailDetection(imageUrl)
    }
  } catch (error) {
    console.error("Error during MediaPipe hand detection:", error)
    return fallbackNailDetection(imageUrl)
  }
}

async function fallbackNailDetection(imageUrl: string): Promise<NailPosition[]> {
  console.log("Using fallback heuristic nail detection for", imageUrl)
  const img = new Image()
  img.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = (e) => reject(new Error(`Fallback: Failed to load image: ${e}`))
    img.src = imageUrl
  })

  const width = img.naturalWidth,
    height = img.naturalHeight
  if (width === 0) return []

  const nailPositions: NailPosition[] = []
  const nailWidth = width * 0.04,
    nailHeight = nailWidth * 1.5
  const handRegionWidth = width * 0.5,
    startX = (width - handRegionWidth) / 2
  const yPos = height * 0.65

  for (let i = 0; i < 5; i++) {
    const nailCenterX = startX + (handRegionWidth / 5) * (i + 0.5)
    const yOffset = i === 0 || i === 4 ? nailHeight * 0.3 : i === 1 || i === 3 ? nailHeight * 0.1 : 0
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
  return nailPositions
}

export async function extractNailDesign(designImageUrl: string): Promise<HTMLCanvasElement> {
  const img = new Image()
  img.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = (e) => reject(new Error(`Failed to load design image: ${e}`))
    img.src = designImageUrl
  })

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

  ctx.drawImage(sourceImage, 0, 0)

  for (const nail of nailPositions) {
    ctx.save()
    ctx.translate(nail.centerX, nail.centerY)
    ctx.rotate(nail.angle * (Math.PI / 180))
    ctx.drawImage(designTemplateCanvas, nail.x, nail.y, nail.width, nail.height)
    ctx.restore()
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
  if (!ctx) throw new Error("Could not get canvas context")

  const img = new Image()
  img.crossOrigin = "anonymous"

  const objectUrl = typeof imageSource === "string" ? null : URL.createObjectURL(imageSource)

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`))
      img.src = objectUrl || (imageSource as string)
    })
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}
