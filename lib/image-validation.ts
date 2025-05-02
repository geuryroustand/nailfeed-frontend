export type ImageValidationOptions = {
  maxSizeInMB: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  aspectRatio?: number
  allowedFormats?: string[]
}

export type ValidationResult = {
  valid: boolean
  message?: string
  file?: File
  dimensions?: {
    width: number
    height: number
  }
}

export const DEFAULT_ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/jpg"]

export const IMAGE_VALIDATION_PRESETS = {
  profileImage: {
    maxSizeInMB: 2,
    minWidth: 200,
    minHeight: 200,
    maxWidth: 2000,
    maxHeight: 2000,
    allowedFormats: DEFAULT_ALLOWED_FORMATS,
  },
  coverImage: {
    maxSizeInMB: 4,
    minWidth: 800,
    minHeight: 200,
    maxWidth: 3000,
    maxHeight: 1000,
    allowedFormats: DEFAULT_ALLOWED_FORMATS,
  },
  postImage: {
    maxSizeInMB: 5,
    minWidth: 320,
    minHeight: 320,
    maxWidth: 4000,
    maxHeight: 4000,
    allowedFormats: DEFAULT_ALLOWED_FORMATS,
  },
}

/**
 * Validates an image file based on the provided options
 */
export async function validateImage(
  file: File,
  options: ImageValidationOptions = IMAGE_VALIDATION_PRESETS.postImage,
): Promise<ValidationResult> {
  // Check file size
  const fileSizeInMB = file.size / (1024 * 1024)
  if (fileSizeInMB > options.maxSizeInMB) {
    return {
      valid: false,
      message: `File size exceeds the maximum allowed size of ${options.maxSizeInMB}MB`,
    }
  }

  // Check file format
  const allowedFormats = options.allowedFormats || DEFAULT_ALLOWED_FORMATS
  if (!allowedFormats.includes(file.type)) {
    return {
      valid: false,
      message: `File format not supported. Please upload ${allowedFormats
        .map((format) => format.replace("image/", ""))
        .join(", ")} files only.`,
    }
  }

  // Check image dimensions
  try {
    const dimensions = await getImageDimensions(file)

    // Check minimum dimensions
    if (options.minWidth && dimensions.width < options.minWidth) {
      return {
        valid: false,
        message: `Image width must be at least ${options.minWidth}px`,
        dimensions,
      }
    }

    if (options.minHeight && dimensions.height < options.minHeight) {
      return {
        valid: false,
        message: `Image height must be at least ${options.minHeight}px`,
        dimensions,
      }
    }

    // Check maximum dimensions
    if (options.maxWidth && dimensions.width > options.maxWidth) {
      return {
        valid: false,
        message: `Image width must not exceed ${options.maxWidth}px`,
        dimensions,
      }
    }

    if (options.maxHeight && dimensions.height > options.maxHeight) {
      return {
        valid: false,
        message: `Image height must not exceed ${options.maxHeight}px`,
        dimensions,
      }
    }

    // Check aspect ratio if specified
    if (options.aspectRatio) {
      const imageRatio = dimensions.width / dimensions.height
      const tolerance = 0.1 // Allow some tolerance in the aspect ratio

      if (Math.abs(imageRatio - options.aspectRatio) > tolerance) {
        return {
          valid: false,
          message: `Image aspect ratio should be approximately ${options.aspectRatio}`,
          dimensions,
        }
      }
    }

    return {
      valid: true,
      file,
      dimensions,
    }
  } catch (error) {
    console.error("Error validating image dimensions:", error)
    return {
      valid: false,
      message: "Failed to validate image dimensions",
    }
  }
}

/**
 * Gets the dimensions of an image file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      })
    }
    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Formats a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + " bytes"
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB"
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }
}

/**
 * Returns a human-readable description of image requirements
 */
export function getImageRequirementsText(options: ImageValidationOptions): string {
  const parts = [`Maximum size: ${options.maxSizeInMB}MB`]

  if (options.minWidth && options.minHeight) {
    parts.push(`Minimum dimensions: ${options.minWidth}×${options.minHeight}px`)
  }

  if (options.maxWidth && options.maxHeight) {
    parts.push(`Maximum dimensions: ${options.maxWidth}×${options.maxHeight}px`)
  }

  if (options.allowedFormats) {
    parts.push(`Formats: ${options.allowedFormats.map((f) => f.replace("image/", "")).join(", ")}`)
  }

  return parts.join(" • ")
}
