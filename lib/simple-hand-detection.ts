"use client"

export interface HandLandmark {
  x: number
  y: number
  id: number
}

export interface NailPosition {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  fingerId: number
  fingerName: string
}

// Simple skin color detection using HSV color space
export function detectSkinPixels(imageData: ImageData): boolean[][] {
  const { data, width, height } = imageData
  const skinMask: boolean[][] = []

  for (let y = 0; y < height; y++) {
    skinMask[y] = []
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Convert RGB to HSV for better skin detection
      const hsv = rgbToHsv(r, g, b)

      // Skin color ranges in HSV
      const isSkin =
        ((hsv.h >= 0 && hsv.h <= 25) || (hsv.h >= 335 && hsv.h <= 360)) &&
        hsv.s >= 0.2 &&
        hsv.s <= 0.7 &&
        hsv.v >= 0.4 &&
        hsv.v <= 0.95

      skinMask[y][x] = isSkin
    }
  }

  return skinMask
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff) % 6
    else if (max === g) h = (b - r) / diff + 2
    else h = (r - g) / diff + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const s = max === 0 ? 0 : diff / max
  const v = max

  return { h, s, v }
}

// Simple contour detection to find hand outline
export function findHandContours(skinMask: boolean[][]): { x: number; y: number }[] {
  const height = skinMask.length
  const width = skinMask[0]?.length || 0
  const contours: { x: number; y: number }[] = []

  // Find edge pixels (skin pixels adjacent to non-skin pixels)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (skinMask[y][x]) {
        // Check if this skin pixel is on the edge
        const isEdge = !skinMask[y - 1][x] || !skinMask[y + 1][x] || !skinMask[y][x - 1] || !skinMask[y][x + 1]

        if (isEdge) {
          contours.push({ x, y })
        }
      }
    }
  }

  return contours
}

// Estimate fingertip positions based on hand contour
export function estimateFingertips(contours: { x: number; y: number }[]): HandLandmark[] {
  if (contours.length === 0) return []

  // Find the topmost points which are likely fingertips
  const sortedByY = [...contours].sort((a, b) => a.y - b.y)
  const topPoints = sortedByY.slice(0, Math.min(20, sortedByY.length))

  // Group nearby points and find peaks
  const fingertips: HandLandmark[] = []
  const minDistance = 30 // Minimum distance between fingertips

  for (const point of topPoints) {
    const tooClose = fingertips.some((tip) => Math.sqrt((tip.x - point.x) ** 2 + (tip.y - point.y) ** 2) < minDistance)

    if (!tooClose && fingertips.length < 5) {
      fingertips.push({
        x: point.x,
        y: point.y,
        id: fingertips.length,
      })
    }
  }

  // Sort fingertips from left to right
  fingertips.sort((a, b) => a.x - b.x)

  return fingertips
}

// Calculate nail positions based on fingertips
export function calculateNailPositions(fingertips: HandLandmark[]): NailPosition[] {
  const fingerNames = ["thumb", "index", "middle", "ring", "pinky"]

  return fingertips.map((tip, index) => ({
    x: tip.x,
    y: tip.y - 10, // Slightly above the detected tip
    width: 20,
    height: 25,
    rotation: 0,
    fingerId: tip.id,
    fingerName: fingerNames[index] || `finger-${index}`,
  }))
}

// Process image and detect hand/nail positions
export async function processHandImage(imageElement: HTMLImageElement): Promise<{
  fingertips: HandLandmark[]
  nailPositions: NailPosition[]
  processedCanvas: HTMLCanvasElement
}> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    canvas.width = imageElement.naturalWidth
    canvas.height = imageElement.naturalHeight

    // Draw image to canvas
    ctx.drawImage(imageElement, 0, 0)

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Detect skin pixels
    const skinMask = detectSkinPixels(imageData)

    // Find hand contours
    const contours = findHandContours(skinMask)

    // Estimate fingertip positions
    const fingertips = estimateFingertips(contours)

    // Calculate nail positions
    const nailPositions = calculateNailPositions(fingertips)

    // Draw debug visualization
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 2

    // Draw fingertips
    fingertips.forEach((tip, index) => {
      ctx.beginPath()
      ctx.arc(tip.x, tip.y, 5, 0, 2 * Math.PI)
      ctx.stroke()

      ctx.fillStyle = "#00ff00"
      ctx.font = "12px Arial"
      ctx.fillText(`${index}`, tip.x + 8, tip.y - 8)
    })

    // Draw nail positions
    ctx.strokeStyle = "#ff0000"
    nailPositions.forEach((nail) => {
      ctx.strokeRect(nail.x - nail.width / 2, nail.y - nail.height / 2, nail.width, nail.height)
    })

    resolve({
      fingertips,
      nailPositions,
      processedCanvas: canvas,
    })
  })
}
