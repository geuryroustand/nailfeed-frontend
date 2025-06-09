import type { PixelCoordinate } from "./mediapipe-hand-utils" // Assuming PixelCoordinate is exported

interface NailTransformations {
  left: number
  top: number
  scaleX: number
  scaleY: number
  angle: number
}

// Landmark indices for index finger: TIP: 8, DIP: 7, PIP: 6
const INDEX_FINGER_TIP = 8
const INDEX_FINGER_DIP = 7
// const INDEX_FINGER_PIP = 6; // Could be used for more advanced scaling/rotation

export function calculateInitialNailTransform(
  nailDesignImage: HTMLImageElement, // The actual nail design image element to get its dimensions
  targetLandmark: PixelCoordinate, // e.g., Index finger tip (landmark 8)
  secondLandmark?: PixelCoordinate, // e.g., Index finger DIP (landmark 7) for orientation/scale
  canvasWidth?: number, // Width of the Fabric canvas
  canvasHeight?: number, // Height of the Fabric canvas
  handImageNaturalWidth?: number, // Natural width of the user's hand image
  handImageNaturalHeight?: number, // Natural height of the user's hand image
): NailTransformations {
  let angle = 0
  let scale = 0.1 // Default scale, adjust as needed

  const nailImageAspectRatio = nailDesignImage.naturalWidth / nailDesignImage.naturalHeight

  // Calculate scale and angle if secondLandmark is provided
  if (targetLandmark && secondLandmark && handImageNaturalWidth && handImageNaturalHeight) {
    const dx = targetLandmark.x - secondLandmark.x
    const dy = targetLandmark.y - secondLandmark.y
    angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90 // +90 to align nail length along the finger

    // Estimate nail length based on distance between DIP and TIP
    const landmarkDistance = Math.sqrt(dx * dx + dy * dy)

    // Desired display height of the nail design (e.g., 1.5 times the landmarkDistance)
    // This is a heuristic and might need adjustment.
    const desiredNailDisplayHeight = landmarkDistance * 1.5

    // Calculate scale based on the nail design's natural height
    if (nailDesignImage.naturalHeight > 0) {
      scale = desiredNailDisplayHeight / nailDesignImage.naturalHeight
    }
  } else if (handImageNaturalWidth) {
    // Fallback scale if only one landmark is available
    // Scale relative to hand image width, e.g., nail is 5% of hand image width
    scale = (handImageNaturalWidth * 0.05) / nailDesignImage.naturalWidth
  }

  // Adjust position to be centered on the landmark
  // Fabric positions objects by their top-left corner by default,
  // but `originX: 'center', originY: 'center'` will be used on the fabric.Image object.
  const position = {
    left: targetLandmark.x,
    top: targetLandmark.y,
  }

  // If canvas dimensions and hand image natural dimensions are provided,
  // scale the position from natural hand image coordinates to canvas coordinates.
  if (canvasWidth && canvasHeight && handImageNaturalWidth && handImageNaturalHeight) {
    position.left = (targetLandmark.x / handImageNaturalWidth) * canvasWidth
    position.top = (targetLandmark.y / handImageNaturalHeight) * canvasHeight
  }

  return {
    left: position.left,
    top: position.top,
    scaleX: scale,
    scaleY: scale, // Maintain aspect ratio initially, or use nailImageAspectRatio for scaleY: scale / nailImageAspectRatio
    angle: angle,
  }
}
