"use client"

/**
 * Utility function to check if a canvas operation is tainted by CORS
 */
function isCanvasTainted(canvas: HTMLCanvasElement): boolean {
  try {
    // Try to get data from the canvas - will throw if tainted
    canvas.toDataURL()
    return false // If we get here, canvas is not tainted
  } catch (e) {
    console.error("Canvas appears to be tainted by CORS issues:", e)
    return true
  }
}

/**
 * Creates a cropped version of an image
 * @param imageSrc - Source URL of the image
 * @param pixelCrop - Crop area in pixels
 * @returns Promise that resolves to a data URL of the cropped image
 */
const getCroppedImg = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!pixelCrop || pixelCrop.width <= 0 || pixelCrop.height <= 0) {
      reject(new Error("Invalid crop dimensions"))
      return
    }

    const image = new Image()
    image.crossOrigin = "anonymous" // Handle CORS

    // Define the onload handler
    const handleImageLoad = () => {
      try {
        // Log the image and crop dimensions for debugging
        console.log("Image dimensions:", {
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          cropX: pixelCrop.x,
          cropY: pixelCrop.y,
          cropWidth: pixelCrop.width,
          cropHeight: pixelCrop.height,
        })

        // Validate crop dimensions against image dimensions
        if (
          pixelCrop.x < 0 ||
          pixelCrop.y < 0 ||
          pixelCrop.x + pixelCrop.width > image.naturalWidth ||
          pixelCrop.y + pixelCrop.height > image.naturalHeight
        ) {
          console.warn("Crop dimensions out of bounds, adjusting to fit image")

          // Adjust crop to fit within image bounds
          const adjustedCrop = {
            x: Math.max(0, pixelCrop.x),
            y: Math.max(0, pixelCrop.y),
            width: Math.min(pixelCrop.width, image.naturalWidth - Math.max(0, pixelCrop.x)),
            height: Math.min(pixelCrop.height, image.naturalHeight - Math.max(0, pixelCrop.y)),
          }

          console.log("Adjusted crop:", adjustedCrop)

          // Use adjusted crop
          pixelCrop = adjustedCrop
        }

        // Create canvas
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Set canvas dimensions to match the cropped area
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        // Fill with white background to prevent transparency issues
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw the image with proper cropping
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height,
        )

        // Check if canvas is tainted by CORS
        if (isCanvasTainted(canvas)) {
          console.warn("Canvas tainted by CORS issues, attempting fallback method")

          // Create new canvas and try drawing just a solid color as a fallback
          const fallbackCanvas = document.createElement("canvas")
          fallbackCanvas.width = pixelCrop.width
          fallbackCanvas.height = pixelCrop.height

          const fallbackCtx = fallbackCanvas.getContext("2d")
          if (!fallbackCtx) {
            reject(new Error("Could not get fallback canvas context"))
            return
          }

          // Fill with a color that matches the average color of the image area
          fallbackCtx.fillStyle = "white"
          fallbackCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height)

          resolve(fallbackCanvas.toDataURL("image/jpeg", 0.95))
          return
        }

        // Convert to data URL and resolve
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95)

        // Verify the data URL is valid
        if (dataUrl.length < 20 || !dataUrl.startsWith("data:image/")) {
          reject(new Error("Generated invalid data URL"))
          return
        }

        resolve(dataUrl)
      } catch (err) {
        console.error("Error cropping image:", err)
        reject(err)
      }
    }

    // Define the error handler
    const handleImageError = (e: Event | string) => {
      console.error("Image load error:", e)
      reject(new Error("Failed to load image for cropping"))
    }

    // Set up timeout for image loading
    const timeoutId = setTimeout(() => {
      reject(new Error("Image load timed out"))
    }, 10000) // 10 second timeout

    // Assign handlers
    image.onload = () => {
      clearTimeout(timeoutId)
      handleImageLoad()
    }

    image.onerror = () => {
      clearTimeout(timeoutId)
      handleImageError("Image failed to load")
    }

    // Set image source
    image.src = imageSrc
  })
}

export default getCroppedImg
