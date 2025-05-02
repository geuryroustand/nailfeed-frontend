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
  postIds: number[]
  shares: CollectionShare[]
  shareLink?: string
  isShared?: boolean
}
