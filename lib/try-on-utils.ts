// Utility functions for the try-on feature with improved nail detection and detailed logging

interface NailPosition {
  x: number
  y: number
  width: number
  height: number
  angle: number
}

let handsModule: any = null

export async function initMediaPipe(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (handsModule) {
    console.log("MediaPipe already initialized")
    return true
  }

  try {
    console.log("Loading MediaPipe Hands script...")
    if (!(window as any).Hands) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js"
      script.async = true
      script.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("MediaPipe script loaded")
          resolve(null)
        }
        script.onerror = (e) => reject(e)
        document.head.appendChild(script)
      })

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (!(window as any).Hands) {
      console.error("MediaPipe Hands still not available after load")
      return false
    }

    console.log("Initializing MediaPipe Hands module...")
    const Hands = (window as any).Hands
    handsModule = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
    })

    handsModule.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })
    console.log("MediaPipe Hands module configured")
    return true
  } catch (err) {
    console.error("Error initializing MediaPipe Hands:", err)
    return false
  }
}

async function processWithMediaPipe(canvas: HTMLCanvasElement): Promise<any> {
  console.log("Processing image with MediaPipe...")
  if (!handsModule) {
    throw new Error("MediaPipe Hands not initialized")
  }

  return new Promise((resolve, reject) => {
    handsModule.onResults((results: any) => {
      console.log("MediaPipe results received", results)
      resolve(results)
    })

    try {
      handsModule.send({ image: canvas })
    } catch (err) {
      console.error("Error sending image to MediaPipe:", err)
      reject(err)
    }
  })
}

export async function detectHands(imageUrl: string): Promise<NailPosition[]> {
  console.log("Starting detectHands for", imageUrl)

  // Initialize MediaPipe if needed
  if (!handsModule) {
    const ok = await initMediaPipe()
    if (!ok) {
      console.warn("Falling back: MediaPipe init failed")
      return fallbackNailDetection(imageUrl)
    }
  }

  // Load image
  console.log("Loading image for analysis...")
  const img = new Image()
  img.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    img.onload = () => {
      console.log("User image loaded", img.width, img.height)
      resolve(null)
    }
    img.onerror = (e) => reject(e)
    img.src = imageUrl
  })

  // Prepare canvas
  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0)

  // Run MediaPipe detection
  let results: any
  try {
    results = await processWithMediaPipe(canvas)
  } catch (err) {
    console.error("MediaPipe processing error, using fallback:", err)
    return fallbackNailDetection(imageUrl)
  }

  if (!results.multiHandLandmarks?.length) {
    console.warn("No hands detected, using fallback detection")
    return fallbackNailDetection(imageUrl)
  }

  console.log(`Detected ${results.multiHandLandmarks.length} hands, extracting nail positions...`)
  const nailPositions: NailPosition[] = []
  const fingertips = [4, 8, 12, 16, 20]
  const middleJoints = [3, 7, 11, 15, 19]
  const baseJoints = [2, 6, 10, 14, 18]

  for (const landmarks of results.multiHandLandmarks) {
    for (let i = 0; i < fingertips.length; i++) {
      const tip = landmarks[fingertips[i]]
      const mid = landmarks[middleJoints[i]]
      const base = landmarks[baseJoints[i]]

      const tipX = tip.x * canvas.width
      const tipY = tip.y * canvas.height
      const midX = mid.x * canvas.width
      const midY = mid.y * canvas.height
      const baseX = base.x * canvas.width
      const baseY = base.y * canvas.height

      const fingerWidth = Math.hypot(midX - baseX, midY - baseY)
      const nailWidth = fingerWidth * 0.75
      const angle = Math.atan2(tipY - midY, tipX - midX) * (180 / Math.PI)
      const offsetX = Math.sin((angle * Math.PI) / 180) * (nailWidth * 0.3)
      const offsetY = -Math.cos((angle * Math.PI) / 180) * (nailWidth * 0.3)

      const pos: NailPosition = {
        x: tipX - nailWidth / 2 + offsetX,
        y: tipY - nailWidth / 2 + offsetY,
        width: nailWidth,
        height: nailWidth * 1.5,
        angle: angle,
      }
      console.log("Nail position computed:", pos)
      nailPositions.push(pos)
    }
  }

  console.log("Finished detectHands, positions:", nailPositions)
  return nailPositions
}

export async function extractNailDesign(designImageUrl: string): Promise<HTMLCanvasElement> {
  try {
    // Load the design image
    const img = new Image()
    img.crossOrigin = "anonymous"
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = designImageUrl
    })

    // Create a canvas for the extracted design
    const size = 200 // Default nail size
    const designCanvas = document.createElement("canvas")
    designCanvas.width = size
    designCanvas.height = size * 1.5 // Oval shape for nail
    const ctx = designCanvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not create canvas context")
    }

    // Clear the canvas
    ctx.clearRect(0, 0, designCanvas.width, designCanvas.height)

    // Create an oval clipping path for the nail shape
    ctx.beginPath()
    ctx.ellipse(size / 2, size * 0.75, size / 2, size * 0.75, 0, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Calculate the best crop area from the source image
    const sourceAspect = img.width / img.height
    const targetAspect = designCanvas.width / designCanvas.height

    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height

    if (sourceAspect > targetAspect) {
      // Source is wider, crop horizontally
      sw = img.height * targetAspect
      sx = (img.width - sw) / 2
    } else {
      // Source is taller, crop vertically
      sh = img.width / targetAspect
      sy = (img.height - sh) / 2
    }

    // Draw the design image scaled to fit the nail shape
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, designCanvas.width, designCanvas.height)

    return designCanvas
  } catch (error) {
    console.error("Error extracting nail design:", error)
    return createFallbackDesign(designImageUrl)
  }
}

async function createFallbackDesign(designImageUrl: string): Promise<HTMLCanvasElement> {
  const img = new Image()
  img.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = designImageUrl
  })

  const size = 200 // Default nail size
  const designCanvas = document.createElement("canvas")
  designCanvas.width = size
  designCanvas.height = size * 1.5 // Oval shape
  const ctx = designCanvas.getContext("2d")

  if (!ctx) throw new Error("Could not create canvas context")

  // Clear canvas
  ctx.clearRect(0, 0, designCanvas.width, designCanvas.height)

  // Create an oval clipping path
  ctx.beginPath()
  ctx.ellipse(size / 2, size * 0.75, size / 2, size * 0.75, 0, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  // Draw the center portion of the image
  const sourceSize = Math.min(img.width, img.height)
  const sx = (img.width - sourceSize) / 2
  const sy = (img.height - sourceSize) / 2

  ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, designCanvas.width, designCanvas.height)

  return designCanvas
}

export async function applyNailDesign(sourceImageUrl: string, designImageUrl: string): Promise<string> {
  try {
    console.log("Starting nail design application process")

    // First detect hands and nail positions
    console.log("Detecting nail positions...")
    const nailPositions = await detectHands(sourceImageUrl)
    console.log(`Detected ${nailPositions.length} nail positions`)

    // Extract the nail design
    console.log("Extracting nail design...")
    const designCanvas = await extractNailDesign(designImageUrl)

    // Create a new canvas for the result
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Could not create canvas context")

    // Load the source image
    const sourceImage = new Image()
    sourceImage.crossOrigin = "anonymous"
    await new Promise((resolve, reject) => {
      sourceImage.onload = resolve
      sourceImage.onerror = reject
      sourceImage.src = sourceImageUrl
    })

    // Set canvas dimensions to match source image
    canvas.width = sourceImage.width
    canvas.height = sourceImage.height

    // Draw the source image
    context.drawImage(sourceImage, 0, 0)

    console.log("Applying nail designs to detected positions...")

    // Apply the design to each detected nail
    if (nailPositions && nailPositions.length > 0) {
      for (const nail of nailPositions) {
        // Save the current context state
        context.save()

        // Translate to the center of the nail position
        context.translate(nail.x + nail.width / 2, nail.y + nail.height / 2)

        // Rotate to match the nail angle
        context.rotate((nail.angle * Math.PI) / 180)

        // Calculate scale to fit the nail size
        const scaleX = nail.width / designCanvas.width
        const scaleY = nail.height / designCanvas.height

        // Apply scaling
        context.scale(scaleX, scaleY)

        // Draw the nail design centered
        context.drawImage(
          designCanvas,
          -designCanvas.width / 2,
          -designCanvas.height / 2,
          designCanvas.width,
          designCanvas.height,
        )

        // Restore the context state
        context.restore()

        // Apply shine effect to make it look more realistic
        applyShineEffect(context, nail.x, nail.y, nail.width, nail.height, nail.angle)
      }

      console.log("Nail designs applied successfully")
    } else {
      // If no nails detected, use a fallback method
      console.log("No nail positions detected, using fallback placement")

      // Apply fallback nails
      const fallbackNails = await fallbackNailDetection(sourceImageUrl)
      for (const nail of fallbackNails) {
        context.save()
        context.translate(nail.x + nail.width / 2, nail.y + nail.height / 2)
        context.rotate((nail.angle * Math.PI) / 180)

        const scaleX = nail.width / designCanvas.width
        const scaleY = nail.height / designCanvas.height
        context.scale(scaleX, scaleY)

        context.drawImage(
          designCanvas,
          -designCanvas.width / 2,
          -designCanvas.height / 2,
          designCanvas.width,
          designCanvas.height,
        )

        context.restore()
        applyShineEffect(context, nail.x, nail.y, nail.width, nail.height, nail.angle)
      }
    }

    // Return the resulting image as data URL
    return canvas.toDataURL("image/png")
  } catch (err) {
    console.error("Error applying nail design:", err)
    throw err
  }
}

function applyShineEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
) {
  ctx.save()

  // Translate and rotate to match nail position
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate((angle * Math.PI) / 180)

  // Create a subtle gradient for shine effect
  const gradient = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2)
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)")
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)")
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

  // Apply the shine as an overlay
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2)
  ctx.fill()

  // Add a highlight spot for extra realism
  const highlightGradient = ctx.createRadialGradient(-width / 4, -height / 4, 0, -width / 4, -height / 4, width / 3)
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)")
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

  ctx.fillStyle = highlightGradient
  ctx.beginPath()
  ctx.ellipse(-width / 4, -height / 4, width / 3, height / 3, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

export async function fallbackNailDetection(imageUrl: string): Promise<NailPosition[]> {
  console.log("Starting fallback nail detection for", imageUrl)
  const img = new Image()
  img.crossOrigin = "anonymous"
  await new Promise((resolve) => {
    img.onload = () => resolve(null)
    img.src = imageUrl
  })

  const width = img.width
  const height = img.height
  const nailPositions: NailPosition[] = []
  const nailWidth = width / 12
  const nailHeight = nailWidth * 1.5
  const startX = width / 4
  const y = (height * 2) / 3

  for (let i = 0; i < 5; i++) {
    const pos = { x: startX + i * nailWidth * 1.5, y, width: nailWidth, height: nailHeight, angle: 0 }
    console.log("Fallback nail position:", pos)
    nailPositions.push(pos)
  }

  return nailPositions
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
    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Check if Web Share API is available
    if (navigator.share) {
      await navigator.share({
        title: title,
        text: "Check out my virtual nail design try-on!",
        files: [new File([blob], "nail-design.png", { type: "image/png" })],
      })
      return true
    } else {
      // Fallback for browsers that don't support Web Share API
      saveImage(dataUrl)
      return false
    }
  } catch (error) {
    console.error("Error sharing image:", error)
    return false
  }
}
