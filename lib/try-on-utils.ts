// This file contains utility functions for the try-on feature

// Interface for nail position
interface NailPosition {
  x: number
  y: number
  width: number
  height: number
  angle: number // Rotation angle for proper placement
}

// MediaPipe Hands module reference
let handsModule: any = null

// Initialize MediaPipe Hands
export async function initMediaPipe() {
  if (typeof window === "undefined") return false
  if (handsModule) return true

  try {
    // Load MediaPipe Hands dynamically
    if (!(window as any).Hands) {
      // Create and load script
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js"
      script.async = true
      script.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })

      // Give a moment for the script to initialize
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Check if Hands is available
    if (!(window as any).Hands) {
      console.error("MediaPipe Hands not available after loading")
      return false
    }

    // Initialize Hands
    const Hands = (window as any).Hands
    handsModule = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
      },
    })

    // Configure Hands
    await handsModule.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    console.log("MediaPipe Hands initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing MediaPipe Hands:", error)
    return false
  }
}

// Process image with MediaPipe Hands
async function processWithMediaPipe(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<any> {
  if (!handsModule) {
    throw new Error("MediaPipe Hands not initialized")
  }

  return new Promise((resolve) => {
    // Set up results handler
    handsModule.onResults((results: any) => {
      resolve(results)
    })

    // Process the image
    handsModule.send({ image: imageElement })
  })
}

// Detect hands and nail positions in an image
export async function detectHands(imageUrl: string): Promise<NailPosition[]> {
  try {
    // Load the image
    const img = new Image()
    img.crossOrigin = "anonymous"
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageUrl
    })

    // Create a canvas for processing
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not create canvas context")

    // Draw the image to the canvas
    ctx.drawImage(img, 0, 0)

    // Check if MediaPipe is available
    if (!handsModule) {
      console.log("MediaPipe not initialized, using fallback detection")
      return fallbackNailDetection(imageUrl)
    }

    // Process with MediaPipe
    try {
      const results = await processWithMediaPipe(canvas)

      // Check if hands were detected
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        console.log("No hands detected, using fallback detection")
        return fallbackNailDetection(imageUrl)
      }

      // Extract nail positions from landmarks
      const nailPositions: NailPosition[] = []

      for (const landmarks of results.multiHandLandmarks) {
        // Fingertip indices as specified: thumb (4), index (8), middle (12), ring (16), pinky (20)
        const fingertips = [4, 8, 12, 16, 20]

        // Middle joints for width calculation
        const middleJoints = [3, 7, 11, 15, 19]

        // Base joints for angle calculation
        const baseJoints = [2, 6, 10, 14, 18]

        for (let i = 0; i < fingertips.length; i++) {
          const tipIndex = fingertips[i]
          const midIndex = middleJoints[i]
          const baseIndex = baseJoints[i]

          const tip = landmarks[tipIndex]
          const mid = landmarks[midIndex]
          const base = landmarks[baseIndex]

          // Convert normalized coordinates to pixel coordinates
          const tipX = tip.x * canvas.width
          const tipY = tip.y * canvas.height
          const midX = mid.x * canvas.width
          const midY = mid.y * canvas.height
          const baseX = base.x * canvas.width
          const baseY = base.y * canvas.height

          // Calculate finger width based on distance between joints
          const fingerWidth = Math.sqrt(Math.pow(midX - baseX, 2) + Math.pow(midY - baseY, 2))

          // Calculate nail width (typically about 70-80% of finger width)
          const nailWidth = fingerWidth * 0.75

          // Calculate angle for proper nail orientation
          const angle = Math.atan2(tipY - midY, tipX - midX) * (180 / Math.PI)

          // Calculate nail position with offset for realistic placement
          // The offset places the nail slightly above the fingertip on the nail bed
          const offsetX = Math.sin(angle * (Math.PI / 180)) * (nailWidth * 0.3)
          const offsetY = -Math.cos(angle * (Math.PI / 180)) * (nailWidth * 0.3)

          nailPositions.push({
            x: tipX - nailWidth / 2 + offsetX,
            y: tipY - nailWidth / 2 + offsetY,
            width: nailWidth,
            height: nailWidth * 1.5, // Nails are typically longer than wide
            angle: angle,
          })
        }
      }

      console.log(`Detected ${nailPositions.length} nail positions using MediaPipe`)
      return nailPositions
    } catch (processingError) {
      console.error("Error processing with MediaPipe:", processingError)
      return fallbackNailDetection(imageUrl)
    }
  } catch (error) {
    console.error("Hand detection error:", error)
    return fallbackNailDetection(imageUrl)
  }
}

// Extract the design from the original image
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

// Create a fallback design if extraction fails
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

// Apply nail design to image with detected hands
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

// Apply shine effect to make nails look more realistic
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

// Fallback nail detection using simple image processing
export async function fallbackNailDetection(imageUrl: string): Promise<NailPosition[]> {
  // This is a simplified fallback that estimates nail positions
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const width = img.width
      const height = img.height

      // Create estimated positions for 5 nails in a row at the bottom third of the image
      const nailPositions: NailPosition[] = []
      const nailWidth = width / 12
      const nailHeight = nailWidth * 1.5
      const startX = width / 4
      const y = (height * 2) / 3

      for (let i = 0; i < 5; i++) {
        nailPositions.push({
          x: startX + i * nailWidth * 1.5,
          y: y,
          width: nailWidth,
          height: nailHeight,
          angle: 0, // Default angle (straight)
        })
      }

      resolve(nailPositions)
    }
    img.onerror = () => resolve([])
    img.src = imageUrl
  })
}

// Save an image to the device
export function saveImage(dataUrl: string, filename = "nail-design-try-on.png") {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Share an image
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
