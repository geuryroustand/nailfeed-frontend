// Simplified try-on utilities without MediaPipe CDN dependencies
interface NailPosition {
  x: number
  y: number
  width: number
  height: number
  angle: number
}

// Remove all MediaPipe loading code and use fallback detection only
export async function initMediaPipe() {
  // Always return true and use fallback detection
  console.log("Using simplified hand detection (MediaPipe disabled for compatibility)")
  return true
}

// Simplified hand detection that always uses fallback
export async function detectHands(imageUrl: string): Promise<NailPosition[]> {
  console.log("Using fallback nail detection")
  return fallbackNailDetection(imageUrl)
}

// Keep the existing extractNailDesign function but remove mask dependency
export async function extractNailDesign(designImageUrl: string): Promise<HTMLCanvasElement> {
  return extractNailDesignFallback(designImageUrl)
}

// Keep the existing applyNailDesign function
export async function applyNailDesign(sourceImageUrl: string, designImageUrl: string): Promise<string> {
  try {
    const nailPositions = await detectHands(sourceImageUrl)
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

// Fallback extraction method if mask loading fails
async function extractNailDesignFallback(designImageUrl: string): Promise<HTMLCanvasElement> {
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
