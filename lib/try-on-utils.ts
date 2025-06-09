// Utility functions for the try-on feature with improved nail detection and detailed logging

interface NailPosition {
  x: number
  y: number
  width: number
  height: number
  angle: number
}

export async function detectHands(imageUrlOrCanvas: string | HTMLCanvasElement): Promise<NailPosition[]> {
  console.log("Starting simplified nail detection.")

  let imageCanvas: HTMLCanvasElement
  let sourceImageWidth: number
  let sourceImageHeight: number

  if (typeof imageUrlOrCanvas === "string") {
    // If imageUrl is provided, load it onto a new canvas
    const img = new Image()
    img.crossOrigin = "anonymous"
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = (e) => reject(new Error(`Failed to load image for detection: ${e}`))
      img.src = imageUrlOrCanvas
    })
    imageCanvas = document.createElement("canvas")
    imageCanvas.width = img.width
    imageCanvas.height = img.height
    const ctx = imageCanvas.getContext("2d")
    if (!ctx) {
      console.error("Could not get canvas context for image loading in detectHands")
      return [] // Return empty if context fails
    }
    ctx.drawImage(img, 0, 0)
    sourceImageWidth = img.width
    sourceImageHeight = img.height
  } else {
    // If a canvas is provided, use it directly
    imageCanvas = imageUrlOrCanvas
    sourceImageWidth = imageCanvas.width
    sourceImageHeight = imageCanvas.height
  }

  if (sourceImageWidth === 0 || sourceImageHeight === 0) {
    console.warn("Image for hand detection has zero dimensions.")
    return []
  }

  const nailPositions: NailPosition[] = []
  const numNails = 5 // Assume 5 nails for one hand typically visible

  // Base nail dimensions relative to image size
  // These ratios can be tuned for better average placement
  const nailWidth = sourceImageWidth * 0.04 // e.g., 4% of image width
  const nailHeight = nailWidth * 1.5 // Maintain a common nail aspect ratio

  // Attempt to position nails in a plausible area (e.g., lower-middle)
  // This is a very rough heuristic and assumes a somewhat centered hand.
  const handRegionCenterY = sourceImageHeight * 0.65 // Y-center for the nail row
  const handRegionWidth = sourceImageWidth * 0.5 // Assumed width of the hand area
  const startX = (sourceImageWidth - handRegionWidth) / 2 // Start X for the nail row

  for (let i = 0; i < numNails; i++) {
    // Distribute nails across the assumed hand region width
    const nailCenterX = startX + (handRegionWidth / numNails) * (i + 0.5)

    // Slight arc for finger tips - middle finger (i=2) highest
    let yOffset = 0
    if (i === 0 || i === 4) yOffset = nailHeight * 0.3 // Thumb/pinky lower
    if (i === 1 || i === 3) yOffset = nailHeight * 0.1 // Index/ring slightly lower
    // i === 2 (middle) has yOffset = 0, making it the highest point in this simple arc

    const currentNailY = handRegionCenterY + yOffset

    const pos: NailPosition = {
      x: nailCenterX - nailWidth / 2, // Top-left x
      y: currentNailY - nailHeight / 2, // Top-left y
      width: nailWidth,
      height: nailHeight,
      angle: 0, // Default angle, can be slightly randomized if desired
    }
    console.log(
      `Simplified nail position ${i + 1}: X=${pos.x.toFixed(0)}, Y=${pos.y.toFixed(0)}, W=${pos.width.toFixed(0)}, H=${pos.height.toFixed(0)}`,
    )
    nailPositions.push(pos)
  }

  if (nailPositions.length === 0) {
    console.warn("Simplified detection failed to produce any nail positions.")
  }

  console.log("Simplified nail detection complete, returning positions:", nailPositions)
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
    console.log("Starting nail design application process (simplified)")

    // First detect hands and nail positions
    console.log("Detecting nail positions (simplified)...")
    const sourceCanvas = await prepareImageForCanvas(sourceImageUrl)
    const nailPositions = await detectHands(sourceCanvas)
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

    console.log("Drawing source image", sourceImage.width, sourceImage.height)
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

        console.log("Drawing nail design at", nail.x, nail.y, nail.width, nail.height)
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

/**
 * Loads an image and prepares it on a canvas for processing
 * @param imageSource - URL or File object of the image to process
 * @returns Promise resolving to the prepared canvas element
 */
export async function prepareImageForCanvas(imageSource: string | File): Promise<HTMLCanvasElement> {
  try {
    console.log("Preparing image for canvas processing...")

    // Create canvas element
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Load the image
    const img = new Image()
    img.crossOrigin = "anonymous"

    // Handle both URL strings and File objects
    if (typeof imageSource === "string") {
      console.log("Loading image from URL:", imageSource)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = (e) => reject(new Error(`Failed to load image from URL: ${e}`))
        img.src = imageSource
      })
    } else {
      console.log("Loading image from File object")
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = (e) => reject(new Error(`Failed to load image from File: ${e}`))
        img.src = URL.createObjectURL(imageSource)
      })
    }

    // Set canvas dimensions to match image
    canvas.width = img.width
    canvas.height = img.height

    // Draw image onto canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Clean up object URL if created from File
    if (typeof imageSource !== "string") {
      URL.revokeObjectURL(img.src)
    }

    console.log("Image prepared on canvas for processing:", {
      width: canvas.width,
      height: canvas.height,
    })

    return canvas
  } catch (error) {
    console.error("Error preparing image for canvas:", error)
    throw error
  }
}
