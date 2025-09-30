// Tutorial user structure
export interface TutorialUser {
  id: number
  documentId: string
  username: string
  displayName?: string | null
  isVerified?: boolean
}

// Tutorial media file structure
export interface TutorialMediaFile {
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

// Tutorial step structure
export interface TutorialStep {
  id: number
  stepNumber: number
  title: string
  description: string
  estimatedDuration?: number // in minutes
  image?: TutorialMediaFile
}

// Tutorial material structure
export interface TutorialMaterial {
  id: number
  name: string
  brand?: string
  optional?: boolean
}

// Tutorial tag structure
export interface TutorialTag {
  id: number
  documentId: string
  name: string
}

// Tutorial difficulty levels
export type TutorialLevel = "beginner" | "intermediate" | "advanced"

// Tutorial techniques
export type TutorialTechnique =
  | "acrylic"
  | "gel"
  | "stamping"
  | "hand-painted"
  | "ombre"
  | "3d"
  | "french"
  | "marble"
  | "chrome"
  | "other"

// Tutorial duration ranges
export type TutorialDuration = "short" | "medium" | "long" // <15min, 15-30min, 30+min

// Main tutorial interface
export interface Tutorial {
  id: number
  documentId: string
  title: string
  slug: string
  description: string
  level: TutorialLevel
  technique: TutorialTechnique
  duration: number // in minutes
  videoUrl?: string | null

  // Counts
  likesCount: number
  commentsCount: number
  savesCount: number
  viewsCount: number

  // Timestamps
  createdAt: string
  updatedAt: string
  publishedAt?: string

  // Relations
  user: TutorialUser
  thumbnail?: TutorialMediaFile
  steps: TutorialStep[]
  materials: TutorialMaterial[]
  tags: TutorialTag[]

  // User interaction
  isLiked?: boolean
  isSaved?: boolean
}

// Filter options
export interface TutorialFilters {
  q?: string // search query
  level?: TutorialLevel
  technique?: TutorialTechnique
  duration?: TutorialDuration
  page?: number
}

// API response types
export interface TutorialListResponse {
  data: Tutorial[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface TutorialDetailResponse {
  data: Tutorial
}
