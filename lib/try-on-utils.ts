// Simplified try-on utilities without MediaPipe dependencies

/**
 * Save an image to the device
 * @param dataUrl The image data URL to save
 * @param filename The filename for the saved image
 */
export function saveImage(dataUrl: string, filename = "nail-photo.png") {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  link.target = "_blank"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Share image using Web Share API or fallback to save
 * @param dataUrl The image data URL to share
 * @param title The title for sharing
 * @returns Promise resolving to success status
 */
export async function shareImage(dataUrl: string, title = "My Nail Photo"): Promise<boolean> {
  try {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const file = new File([blob], "nail-photo.png", { type: "image/png" })
    
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text: "Check out my nail photo!",
        files: [file],
      })
      return true
    } else if (navigator.clipboard) {
      // Fallback: copy image to clipboard (if supported)
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
      return true
    }
  } catch (error) {
    console.error("Error sharing image:", error)
  }
  
  // Final fallback: save to device
  saveImage(dataUrl)
  return false
}

/**
 * Prepare an image on canvas for processing
 * @param imageSource The image source (URL or File)
 * @returns Promise resolving to a canvas element
 */
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

/**
 * Convert a File to data URL
 * @param file The file to convert
 * @returns Promise resolving to data URL string
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      resolve(result)
    }
    reader.onerror = (e) => {
      reject(new Error("Failed to read file"))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Capture image from video element
 * @param video The video element
 * @param canvas The canvas element to draw on
 * @returns The captured image as data URL
 */
export function captureImageFromVideo(video: HTMLVideoElement, canvas: HTMLCanvasElement): string {
  const context = canvas.getContext("2d")
  
  if (!context) {
    throw new Error("Could not get canvas context")
  }
  
  // Set canvas dimensions to match video
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // Draw the current video frame to the canvas
  context.drawImage(video, 0, 0)
  
  // Get the captured image as data URL
  return canvas.toDataURL("image/png")
}

/**
 * Stop all tracks in a media stream
 * @param stream The media stream to stop
 */
export function stopMediaStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}
