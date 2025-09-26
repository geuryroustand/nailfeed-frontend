export interface MediaItem {
  id: string
  type: "image" | "video"
  url?: string
  file?: {
    formats?: {
      thumbnail?: { url: string; width: number; height: number }
      small?: { url: string; width: number; height: number }
      medium?: { url: string; width: number; height: number }
      large?: { url: string; width: number; height: number }
    }
  }
  // For edit modal functionality
  isUploading?: boolean
  uploadFile?: File
}

// Update the MediaGalleryLayout type to match the Strapi enum
export type MediaGalleryLayout = "grid" | "carousel" | "featured"
