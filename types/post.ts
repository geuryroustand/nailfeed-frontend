export interface Post {
  id: number
  documentId?: string
  userId?: string | number | null
  username: string
  userImage: string
  image?: string
  video?: string
  mediaItems?: {
    id: string | number
    type: string
    url: string
  }[]
  galleryLayout?: string
  description: string
  likes: number
  comments: any[]
  timestamp: string
  contentType?: "image" | "video" | "text-background" | "media-gallery"
  background?: any
  tags?: string[]
}
