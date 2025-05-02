"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ImageCropper from "./image-cropper"
import { getImageRequirementsText, IMAGE_VALIDATION_PRESETS } from "@/lib/image-validation"

interface ImageUploadWithCropProps {
  currentImageUrl?: string | undefined
  onImageChange: (blob: Blob) => void
  onImageRemove?: () => void
  aspect: number
  cropShape?: "rect" | "round"
  type: "profile" | "cover"
  className?: string
}

export default function ImageUploadWithCrop({
  currentImageUrl,
  onImageChange,
  onImageRemove,
  aspect,
  cropShape = "rect",
  type,
  className,
}: ImageUploadWithCropProps) {
  const [imageToEdit, setImageToEdit] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cropperKey, setCropperKey] = useState(0) // Used to force remount of cropper

  // Define max dimensions based on image type
  const maxWidth = type === "profile" ? 500 : 1200
  const maxHeight = type === "profile" ? 500 : 400

  // Initialize preview with current image URL if available
  useEffect(() => {
    if (currentImageUrl && !previewUrl) {
      setPreviewUrl(currentImageUrl)
    }
  }, [currentImageUrl, previewUrl])

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== currentImageUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      if (imageToEdit) {
        URL.revokeObjectURL(imageToEdit)
      }
    }
  }, [previewUrl, currentImageUrl, imageToEdit])

  const validationPreset =
    type === "profile" ? IMAGE_VALIDATION_PRESETS.profileImage : IMAGE_VALIDATION_PRESETS.coverImage

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)

    if (!file) return

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > validationPreset.maxSizeInMB) {
      setError(`El tamaño del archivo excede el máximo permitido de ${validationPreset.maxSizeInMB}MB`)
      return
    }

    // Check file format
    const allowedFormats = validationPreset.allowedFormats || ["image/jpeg", "image/png", "image/jpg"]
    if (!allowedFormats.includes(file.type)) {
      setError(
        `Formato de archivo no soportado. Por favor sube archivos ${allowedFormats
          .map((format) => format.replace("image/", ""))
          .join(", ")}.`,
      )
      return
    }

    // First clear any existing image to ensure clean state
    if (imageToEdit) {
      URL.revokeObjectURL(imageToEdit)
      setImageToEdit(null)
    }

    // Small delay to ensure clean state before setting new image
    setTimeout(() => {
      // Create a URL for the file and open the cropper
      const fileUrl = URL.createObjectURL(file)
      setImageToEdit(fileUrl)

      // Force remount of cropper component to ensure it initializes properly
      setCropperKey((prev) => prev + 1)
    }, 50)
  }

  const handleCropComplete = (blob: Blob) => {
    // Clean up previous preview URL if it exists
    if (previewUrl && previewUrl !== currentImageUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    // Create a URL for the blob to preview it
    const objectUrl = URL.createObjectURL(blob)
    setPreviewUrl(objectUrl)

    // Pass the cropped blob to the parent component
    onImageChange(blob)

    // Clean up the image to edit URL
    if (imageToEdit) {
      URL.revokeObjectURL(imageToEdit)
    }
    setImageToEdit(null)
  }

  const handleCropCancel = () => {
    if (imageToEdit) {
      URL.revokeObjectURL(imageToEdit)
    }
    setImageToEdit(null)
  }

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl !== currentImageUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(null)

    if (onImageRemove) {
      onImageRemove()
    }

    // Reset the file input
    const fileInput = document.getElementById(`${type}ImageInput`) as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  // Profile image component
  if (type === "profile") {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="relative">
          <Avatar className="h-20 w-20 border-4 border-white">
            <AvatarImage src={previewUrl || currentImageUrl || "/placeholder.svg"} alt="Profile" />
            <AvatarFallback>
              <Camera className="h-8 w-8 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            id={`${type}ImageInput`}
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor={`${type}ImageInput`}
            className="absolute bottom-0 right-0 bg-white p-1 rounded-full cursor-pointer shadow-sm"
          >
            <Camera className="h-3 w-3" />
          </label>
          {(previewUrl || currentImageUrl) && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 bg-white"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-center text-red-500 text-xs mt-1">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-2">{getImageRequirementsText(validationPreset)}</p>

        {imageToEdit && (
          <ImageCropper
            key={cropperKey}
            image={imageToEdit}
            aspect={aspect}
            cropShape={cropShape}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
          />
        )}
      </div>
    )
  }

  // Cover image component
  return (
    <div className={className}>
      <div className="relative">
        <div
          className="h-32 bg-gray-100 rounded-md overflow-hidden"
          style={{
            backgroundImage: previewUrl || currentImageUrl ? `url(${previewUrl || currentImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!previewUrl && !currentImageUrl && (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <Camera className="h-8 w-8" />
            </div>
          )}
          <input
            type="file"
            id={`${type}ImageInput`}
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor={`${type}ImageInput`}
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-full cursor-pointer"
          >
            <Camera className="h-4 w-4" />
          </label>
          {(previewUrl || currentImageUrl) && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-2 left-2 h-6 w-6 rounded-full p-0 bg-white/80 backdrop-blur-sm"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">{getImageRequirementsText(validationPreset)}</p>

      {imageToEdit && (
        <ImageCropper
          key={cropperKey}
          image={imageToEdit}
          aspect={aspect}
          cropShape={cropShape}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
        />
      )}
    </div>
  )
}
