import type { Post } from "@/lib/post-data"

export interface CollectionShare {
  id: string
  collectionId: string
  type: "link" | "user" | "social"
  recipient?: string
  permission: "view" | "edit"
  createdAt: string
  expiresAt?: string
  isActive: boolean
}

export interface Collection {
  id: string
  name: string
  description?: string
  coverImage?: string
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  /**
   * Stored as Strapi document identifiers to support both numeric and UUID-style IDs.
   * Always compare using string equality.
   */
  postIds: string[]
  owner?: {
    id?: string
    documentId?: string
    username?: string
    displayName?: string
  }
  shares: CollectionShare[]
  shareLink?: string
  isShared?: boolean
  posts?: Post[]
}
