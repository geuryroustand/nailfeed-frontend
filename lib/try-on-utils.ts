// lib/try-on-utils.ts

// Simplified, browser-safe utility functions for the try-on feature.
// This version completely removes MediaPipe to avoid Node.js-specific errors.

interface NailPosition {
  x: number
  y: number
  width: number
  height: number
  angle: number
}

/**
 * A simplified, heuristic-based function to estimate nail positions.
 * It does not use any external libraries.
 * @param imageUrl The URL of the hand image.
 * @returns A promise that resolves to an array of estimated nail positions.
 */
export async function detectHands(imageUrl: string): Promise<NailPosition[]> {
  console.log("Starting simplified fallback nail detection for", imageUrl)
  const img = new Image()
  img.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    img.onload = () => resolve(null)
    img.onerror = (e) => reject(new Error(`Failed to load image for detection: ${e}`))
    img.src = imageUrl
  })

  const width = img.width
  const height = img.height

  if (width === 0 || height === 0) {
    console.warn("Image for hand detection has zero dimensions.")
    return []
  }

  const nailPositions: NailPosition[] = []
  // Assume 5 nails for one hand, placed in a plausible region.
  const nailWidth = width * 0.04 // 4% of image width
  const nailHeight = nailWidth * 1.5 // Maintain aspect ratio
  const handRegionWidth = width * 0.5
  const startX = (width - handRegionWidth) / 2
  const y = height * 0.65 // Place nails in the lower-middle part of the image

  for (let i = 0; i < 5; i++) {
    const nailCenterX = startX + (handRegionWidth / 5) * (i + 0.5)

    // Create a slight arc for the fingertips
    let yOffset = 0
    if (i === 0 || i === 4) yOffset = nailHeight * 0.3 // Thumb/pinky lower
    if (i === 1 || i === 3) yOffset = nailHeight * 0.1 // Index/ring slightly lower

    const pos = {
      x: nailCenterX - nailWidth / 2,
      y: y + yOffset - nailHeight / 2,
      width: nailWidth,
      height: nailHeight,
      angle: 0, // Default to a straight angle
    }
    console.log(`Simplified nail position ${i + 1}:`, pos)
    nailPositions.push(pos)
  }

  return nailPositions
}

export async function extractNailDesign(designImageUrl: string): Promise<HTMLCanvasElement> {
  try {
    const img = new Image()
    img.crossOrigin = "anonymous"
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = designImageUrl
    })

    const size = 200
    const designCanvas = document.createElement("canvas")
    designCanvas.width = size
    designCanvas.height = size * 1.5
    const ctx = designCanvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not create canvas context")
    }

    ctx.clearRect(0, 0, designCanvas.width, designCanvas.height)
    ctx.beginPath()
    ctx.ellipse(size / 2, size * 0.75, size / 2, size * 0.75, 0, 0, Math.PI * 2)
    ctx.closePath()
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
  } catch (error) {
    console.error("Error extracting nail design:", error)
    throw error // Re-throw to be caught by the caller
  }
}

export async function applyNailDesign(sourceImageUrl: string, designImageUrl: string): Promise<string> {
  try {
    console.log("Starting simplified nail design application process")

    const nailPositions = await detectHands(sourceImageUrl)
    if (nailPositions.length === 0) {
      console.warn("No nail positions were detected. Returning original image.")
      return sourceImageUrl
    }

    const designCanvas = await extractNailDesign(designImageUrl)
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Could not create canvas context")

    const sourceImage = new Image()
    sourceImage.crossOrigin = "anonymous"
    await new Promise((resolve, reject) => {
      sourceImage.onload = resolve
      sourceImage.onerror = reject
      sourceImage.src = sourceImageUrl
    })

    canvas.width = sourceImage.width
    canvas.height = sourceImage.height
    context.drawImage(sourceImage, 0, 0)

    console.log("Applying nail designs to estimated positions...")
    for (const nail of nailPositions) {
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

    console.log("Nail designs applied successfully.")
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
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate((angle * Math.PI) / 180)

  const gradient = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2)
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)")
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)")
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2)
  ctx.fill()

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
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    if (navigator.share) {
      await navigator.share({
        title: title,
        text: "Check out my virtual nail design try-on!",
        files: [new File([blob], "nail-design.png", { type: "image/png" })],
      })
      return true
    } else {
      saveImage(dataUrl)
      return false
    }
  } catch (error) {
    console.error("Error sharing image:", error)
    return false
  }
}

/**
 * Loads an image and prepares it on a canvas for processing.
 * This function is a general utility and does not depend on MediaPipe.
 * @param imageSource - URL or File object of the image to process
 * @returns Promise resolving to the prepared canvas element
 */
export async function prepareImageForCanvas(imageSource: string | File): Promise<HTMLCanvasElement> {
  try {
    console.log("Preparing image for canvas processing...")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    if (typeof imageSource === "string") {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = (e) => reject(new Error(`Failed to load image from URL: ${e}`))
        img.src = imageSource
      })
    } else {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = (e) => reject(new Error(`Failed to load image from File: ${e}`))
        img.src = URL.createObjectURL(imageSource)
      })
    }

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    if (typeof imageSource !== "string") {
      URL.revokeObjectURL(img.src)
    }

    console.log("Image prepared successfully on canvas:", {
      width: canvas.width,
      height: canvas.height,
    })

    return canvas
  } catch (error) {
    console.error("Error preparing image for canvas:", error)
    throw error
  }
}
