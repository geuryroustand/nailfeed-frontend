// Backend reaction structure - matches Strapi v5 response
export interface Reaction {
  type: "like" | "love" | "haha" | "wow" | "sad" | "angry"
  label: string
  emoji: string
  count: number
}

// User structure from backend
export interface PostUser {
  id: number
  documentId: string
  username: string
  displayName?: string | null
  isVerified?: boolean
}

// Direct media file structure from Strapi upload
export interface MediaFile {
  id: number
  documentId?: string
  name: string
  alternativeText?: string | null
  caption?: string | null
  width?: number
  height?: number
  formats?: any
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl?: string | null
  provider: string
  provider_metadata?: any
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

// Media item structure from backend (legacy)
export interface MediaItem {
  id: number
  documentId: string
  type: "image" | "video"
  order: number
  file: {
    id: number
    documentId: string
    url: string
    name: string
    alternativeText?: string | null
  }
}

// Tag structure from backend
export interface PostTag {
  id: number
  documentId: string
  name: string
}

export interface Post {
  id: number
  documentId: string
  title?: string
  description: string
  contentType: "image" | "video" | "text" | "text-background" | "media-gallery"
  background?: any

  // Backend calculated counts
  likesCount: number
  commentsCount: number
  savesCount: number
  viewsCount?: number
  shareCount?: number

  featured?: boolean
  galleryLayout?: "grid" | "carousel" | "featured"
  isReported?: boolean
  postStatus?: "draft" | "published" | "archived" | "deleted"

  // Timestamps
  createdAt: string
  updatedAt: string
  publishedAt?: string

  // Relations
  user: PostUser
  tags: PostTag[]
  media?: MediaFile[] // Direct media relation from Strapi
  mediaItems: MediaItem[] // Legacy media items

  // New reaction structure from backend
  reactions: Reaction[]
  userReaction?: "like" | "love" | "haha" | "wow" | "sad" | "angry" | null

  // Legacy fields for backward compatibility
  userId?: string | number | null // deprecated, use user.documentId
  username?: string // deprecated, use user.username
  userImage?: string // deprecated
  image?: string // deprecated, use mediaItems
  video?: string // deprecated, use mediaItems
  timestamp?: string // deprecated, use createdAt
  likes?: number // deprecated, use likesCount
  comments?: any[] // deprecated, use commentsCount
}
