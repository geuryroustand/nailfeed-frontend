"use client"

import type { ReactNode } from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { Collection, CollectionShare } from "@/types/collection"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { normalizeImageUrl } from "@/lib/image-utils"

type RefreshOptions = {
  silent?: boolean
}

interface CollectionsContextType {
  collections: Collection[]
  savedPosts: Record<string, boolean>
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refreshCollections: (options?: RefreshOptions) => Promise<void>
  createCollection: (
    name: string,
    description?: string,
    isPrivate?: boolean,
    coverImageId?: number
  ) => Promise<Collection>
  updateCollection: (
    id: string,
    data: Partial<Collection>
  ) => Promise<{ success: boolean; message: string; collection?: Collection }>
  deleteCollection: (id: string) => Promise<{ success: boolean; message: string }>
  saveToCollection: (postId: string | number, collectionId: string) => Promise<void>
  removeFromCollection: (postId: string | number, collectionId: string) => Promise<void>
  getPostCollections: (postId: string | number) => Collection[]
  isSaved: (postId: string | number) => boolean
  shareCollection: (
    collectionId: string,
    shareType: "link" | "user" | "social",
    options?: {
      recipient?: string
      permission?: "view" | "edit"
      expiresAt?: string
    }
  ) => Promise<CollectionShare>
  getShareLink: (collectionId: string) => Promise<string>
  removeShare: (collectionId: string, shareId: string) => Promise<void>
  updateSharePermission: (
    collectionId: string,
    shareId: string,
    permission: "view" | "edit"
  ) => Promise<void>
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined)

function ensureArray(input: any): any[] {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input
  }

  if (Array.isArray(input.data)) {
    return input.data
  }

  return []
}

function toPostIdentifier(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === "string" && value.length > 0) {
    return value
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString()
  }

  return undefined
}

function extractPostIdentifier(post: any): string | undefined {
  if (!post) {
    return undefined
  }

  if (typeof post === "string" || typeof post === "number") {
    return toPostIdentifier(post)
  }

  return (
    toPostIdentifier(post.documentId ?? post.document_id ?? post.id) ??
    toPostIdentifier(post.attributes?.documentId ?? post.attributes?.document_id ?? post.attributes?.id) ??
    toPostIdentifier(post.attributes?.legacyId ?? post.attributes?.legacy_id)
  )
}

function resolveMediaUrl(media: any): string | undefined {
  if (!media) {
    return undefined
  }

  if (Array.isArray(media) && media.length > 0) {
    for (const item of media) {
      const candidate = resolveMediaUrl(item)
      if (candidate) {
        return candidate
      }
    }
    return undefined
  }

  if (Array.isArray(media?.data) && media.data.length > 0) {
    return resolveMediaUrl(media.data[0])
  }

  if (media?.data && typeof media.data === "object") {
    return resolveMediaUrl(media.data)
  }

  const candidates = [
    media?.url,
    media?.attributes?.url,
    media?.formats?.medium?.url,
    media?.formats?.small?.url,
    media?.formats?.large?.url,
    media?.formats?.thumbnail?.url,
    media?.attributes?.formats?.medium?.url,
    media?.attributes?.formats?.small?.url,
    media?.attributes?.formats?.large?.url,
    media?.attributes?.formats?.thumbnail?.url
  ]

  const url = candidates.find((value) => typeof value === "string" && value.length > 0)
  return url ? normalizeImageUrl(url) : undefined
}

function transformShareEntity(entity: any, collectionId: string): CollectionShare {
  const source = entity?.attributes ?? entity ?? {}
  const rawId = entity?.documentId ?? source.documentId ?? entity?.id ?? source.id ?? Date.now().toString(36)

  return {
    id: String(rawId),
    collectionId,
    type: source.type ?? "link",
    recipient: source.recipient ?? undefined,
    permission: source.permission === "edit" ? "edit" : "view",
    createdAt: source.createdAt ?? new Date().toISOString(),
    expiresAt: source.expiresAt ?? undefined,
    isActive: source.isActive ?? true
  }
}

function transformCollectionEntity(entity: any): Collection {
  if (!entity) {
    throw new Error("Invalid collection payload")
  }

  const source = entity.attributes ? { ...entity.attributes } : { ...entity }
  const documentId =
    entity.documentId ??
    source.documentId ??
    entity.id?.toString() ??
    source.id?.toString()

  if (!documentId) {
    throw new Error("Collection is missing documentId")
  }

  const visibility = source.visibility ?? (source.isPrivate ? "private" : "public")
  const coverImage = resolveMediaUrl(source.coverImage ?? source.cover_image)
  const postsSource = ensureArray(source.posts)
  const sharesSource = ensureArray(source.shares)
  const ownerSource = source.owner?.data ?? source.owner ?? entity.owner?.data ?? entity.owner
  const owner = ownerSource
    ? {
        id: ownerSource.id?.toString() ?? undefined,
        documentId:
          ownerSource.documentId ??
          ownerSource.document_id ??
          ownerSource.id?.toString() ??
          ownerSource.attributes?.documentId ??
          ownerSource.attributes?.document_id,
        username:
          ownerSource.username ??
          ownerSource.attributes?.username ??
          ownerSource.handle,
        displayName: ownerSource.displayName ?? ownerSource.attributes?.displayName,
      }
    : undefined

  const postIds = Array.from(
    new Set(
      postsSource
        .map((post: any) => extractPostIdentifier(post))
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )

  const shares = sharesSource.map((share: any) => transformShareEntity(share, documentId))
  const shareToken = source.shareToken ?? source.share_token
  const shareLink = shareToken ? `/shared/collection/${documentId}?token=${shareToken}` : source.shareLink

  return {
    id: documentId,
    name: source.name ?? "Untitled collection",
    description: source.description ?? undefined,
    coverImage,
    isPrivate: (visibility ?? "private") === "private",
    createdAt: source.createdAt ?? new Date().toISOString(),
    updatedAt: source.updatedAt ?? new Date().toISOString(),
    postIds,
    owner,
    shares,
    shareLink: shareLink ?? undefined,
    isShared: shares.length > 0 || Boolean(shareToken)
  }
}

function buildSavedPostMap(collections: Collection[]): Record<string, boolean> {
  const map: Record<string, boolean> = {}

  for (const collection of collections) {
    for (const id of collection.postIds) {
      const key = toPostIdentifier(id)
      if (key) {
        map[key] = true
      }
    }
  }

  return map
}

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [collections, setCollections] = useState<Collection[]>([])
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshCollections = useCallback(async (options?: RefreshOptions) => {
    const useSilent = options?.silent === true

    if (!isAuthenticated) {
      setCollections([])
      setSavedPosts({})
      setError(null)
      if (useSilent) {
        setIsRefreshing(false)
      } else {
        setIsLoading(false)
      }
      return
    }

    if (useSilent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params = new URLSearchParams({
        "populate[0]": "coverImage",
        "populate[1]": "posts",
        "populate[2]": "shares",
        "fields[0]": "name",
        "fields[1]": "description",
        "fields[2]": "visibility",
        "fields[3]": "shareToken",
        "fields[4]": "createdAt",
        "fields[5]": "updatedAt",
        sort: "updatedAt:desc"
      })

      const response = await fetch(`/api/auth-proxy/collections?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(errorText || `Failed to load collections (${response.status})`)
      }

      const payload = await response.json()
      const rawCollections = ensureArray(payload)
      const parsedCollections = rawCollections.map((item) => transformCollectionEntity(item))

      setCollections(parsedCollections)
      setSavedPosts(buildSavedPostMap(parsedCollections))
      setError(null)
    } catch (refreshError) {
      console.error("Failed to load collections:", refreshError)
      setError(refreshError instanceof Error ? refreshError.message : "Unknown error")
      if (!useSilent) {
        toast({
          title: "Could not load collections",
          description: "Please try again in a moment.",
          variant: "destructive"
        })
      }
    } finally {
      if (useSilent) {
        setIsRefreshing(false)
      } else {
        setIsLoading(false)
      }
    }
  }, [isAuthenticated, toast])

  useEffect(() => {
    refreshCollections().catch((bootstrapError) => {
      console.error("Collections bootstrap error:", bootstrapError)
    })
  }, [refreshCollections])

  const createCollection = useCallback(
    async (
      name: string,
      description?: string,
      isPrivate = false,
      coverImageId?: number
    ): Promise<Collection> => {
      if (!isAuthenticated) {
        throw new Error("Authentication required")
      }

      const payload: Record<string, unknown> = {
        name,
        visibility: isPrivate ? "private" : "public"
      }

      if (description !== undefined) {
        payload.description = description || undefined
      }

      if (typeof coverImageId === "number") {
        payload.coverImage = coverImageId
      }

      const response = await fetch("/api/auth-proxy/collections", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: payload })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(errorText || "Failed to create collection")
      }

      const body = await response.json()
      const created = transformCollectionEntity(body.data ?? body)

      let nextCollections: Collection[] = []
      setCollections((prev) => {
        const exists = prev.some((collection) => collection.id === created.id)
        nextCollections = exists
          ? prev.map((collection) => (collection.id === created.id ? created : collection))
          : [...prev, created]
        return nextCollections
      })
      setSavedPosts(buildSavedPostMap(nextCollections))

      void refreshCollections({ silent: true })
      return created
    },
    [isAuthenticated, refreshCollections]
  )

  const updateCollection = useCallback(
    async (
      id: string,
      data: Partial<Collection>
    ): Promise<{ success: boolean; message: string; collection?: Collection }> => {
      if (!isAuthenticated) {
        return { success: false, message: "Authentication required" }
      }

      const payload: Record<string, unknown> = {}

      if (data.name !== undefined) {
        payload.name = data.name
      }

      if (data.description !== undefined) {
        payload.description = data.description ?? null
      }

      if (data.isPrivate !== undefined) {
        payload.visibility = data.isPrivate ? "private" : "public"
      }

      if (Object.keys(payload).length === 0) {
        const existing = collections.find((collection) => collection.id === id)
        return { success: true, message: "No changes applied", collection: existing }
      }

      const response = await fetch(`/api/auth-proxy/collections/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: payload })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        return {
          success: false,
          message: errorText || "Failed to update collection"
        }
      }

      const body = await response.json()
      const updated = transformCollectionEntity(body.data ?? body)

      let nextCollections: Collection[] = []
      setCollections((prev) => {
        nextCollections = prev.map((collection) =>
          collection.id === updated.id ? updated : collection
        )
        return nextCollections
      })
      setSavedPosts(buildSavedPostMap(nextCollections))

      void refreshCollections({ silent: true })
      return { success: true, message: "Collection updated", collection: updated }
    },
    [collections, isAuthenticated, refreshCollections]
  )

  const deleteCollection = useCallback(
    async (id: string): Promise<{ success: boolean; message: string }> => {
      if (!isAuthenticated) {
        return { success: false, message: "Authentication required" }
      }

      const response = await fetch(`/api/auth-proxy/collections/${id}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        return {
          success: false,
          message: errorText || "Failed to delete collection"
        }
      }

      let nextCollections: Collection[] = []
      setCollections((prev) => {
        nextCollections = prev.filter((collection) => collection.id !== id)
        return nextCollections
      })
      setSavedPosts(buildSavedPostMap(nextCollections))

      void refreshCollections({ silent: true })
      return { success: true, message: "Collection deleted" }
    },
    [isAuthenticated, refreshCollections]
  )

  const saveToCollection = useCallback(
    async (postId: string | number, collectionId: string) => {
      if (!isAuthenticated) {
        throw new Error("Authentication required")
      }

      const target = collections.find((collection) => collection.id === collectionId)
      if (!target) {
        throw new Error("Collection not found")
      }

      const identifier = toPostIdentifier(postId)
      if (!identifier) {
        throw new Error("Invalid post identifier")
      }

      if (target.postIds.includes(identifier)) {
        return
      }

      const updatedPostIds = Array.from(new Set([...target.postIds, identifier]))

      const response = await fetch(`/api/auth-proxy/collections/${collectionId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: { posts: updatedPostIds } })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(errorText || "Failed to add post to collection")
      }

      const body = await response.json()
      const updated = transformCollectionEntity(body.data ?? body)

      let nextCollections: Collection[] = []
      setCollections((prev) => {
        nextCollections = prev.map((collection) =>
          collection.id === updated.id ? updated : collection
        )
        return nextCollections
      })
      setSavedPosts(buildSavedPostMap(nextCollections))

      void refreshCollections({ silent: true })
    },
    [collections, isAuthenticated, refreshCollections]
  )

  const removeFromCollection = useCallback(
    async (postId: string | number, collectionId: string) => {
      if (!isAuthenticated) {
        throw new Error("Authentication required")
      }

      const target = collections.find((collection) => collection.id === collectionId)
      if (!target) {
        throw new Error("Collection not found")
      }

      const identifier = toPostIdentifier(postId)
      if (!identifier) {
        throw new Error("Invalid post identifier")
      }

      if (!target.postIds.includes(identifier)) {
        return
      }

      const remainingPostIds = target.postIds.filter((id) => id !== identifier)

      const response = await fetch(`/api/auth-proxy/collections/${collectionId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: { posts: remainingPostIds } })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(errorText || "Failed to remove post from collection")
      }

      const body = await response.json()
      const updated = transformCollectionEntity(body.data ?? body)

      let nextCollections: Collection[] = []
      setCollections((prev) => {
        nextCollections = prev.map((collection) =>
          collection.id === updated.id ? updated : collection
        )
        return nextCollections
      })
      setSavedPosts(buildSavedPostMap(nextCollections))

      void refreshCollections({ silent: true })
    },
    [collections, isAuthenticated, refreshCollections]
  )

  const getPostCollections = useCallback(
    (postId: string | number) => {
      const identifier = toPostIdentifier(postId)
      if (!identifier) {
        return []
      }

      return collections.filter((collection) => collection.postIds.includes(identifier))
    },
    [collections]
  )

  const isSaved = useCallback(
    (postId: string | number) => {
      const identifier = toPostIdentifier(postId)
      return identifier ? Boolean(savedPosts[identifier]) : false
    },
    [savedPosts]
  )

  const shareCollection = useCallback(
    async (
      collectionId: string,
      shareType: "link" | "user" | "social",
      options?: {
        recipient?: string
        permission?: "view" | "edit"
        expiresAt?: string
      }
    ): Promise<CollectionShare> => {
      const collection = collections.find((item) => item.id === collectionId)
      if (!collection) {
        throw new Error("Collection not found")
      }

      const newShare: CollectionShare = {
        id: Date.now().toString(36),
        collectionId,
        type: shareType,
        recipient: options?.recipient,
        permission: options?.permission ?? "view",
        createdAt: new Date().toISOString(),
        expiresAt: options?.expiresAt,
        isActive: true
      }

      setCollections((prev) =>
        prev.map((item) =>
          item.id === collectionId
            ? {
                ...item,
                shares: [...item.shares, newShare],
                isShared: true
              }
            : item
        )
      )

      toast({
        title: "Collection shared",
        description:
          shareType === "link"
            ? "Shareable link generated."
            : `Collection shared with ${options?.recipient ?? "a user"}.`
      })

      return newShare
    },
    [collections, toast]
  )

  const getShareLink = useCallback(
    async (collectionId: string): Promise<string> => {
      const collection = collections.find((item) => item.id === collectionId)
      if (!collection) {
        throw new Error("Collection not found")
      }

      if (collection.shareLink) {
        return collection.shareLink
      }

      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const shareLink = `${origin}/shared/collection/${collectionId}?token=${Date.now().toString(36)}`

      setCollections((prev) =>
        prev.map((item) =>
          item.id === collectionId
            ? {
                ...item,
                shareLink,
                isShared: true
              }
            : item
        )
      )

      toast({
        title: "Share link created",
        description: "Anyone with the link can view this collection."
      })

      return shareLink
    },
    [collections, toast]
  )

  const removeShare = useCallback(
    async (collectionId: string, shareId: string) => {
      setCollections((prev) =>
        prev.map((item) => {
          if (item.id !== collectionId) {
            return item
          }

          const nextShares = item.shares.filter((share) => share.id !== shareId)
          return {
            ...item,
            shares: nextShares,
            isShared: nextShares.length > 0
          }
        })
      )

      toast({
        title: "Share removed",
        description: "The collection is no longer shared with that entry."
      })
    },
    [toast]
  )

  const updateSharePermission = useCallback(
    async (collectionId: string, shareId: string, permission: "view" | "edit") => {
      setCollections((prev) =>
        prev.map((item) => {
          if (item.id !== collectionId) {
            return item
          }

          return {
            ...item,
            shares: item.shares.map((share) =>
              share.id === shareId
                ? {
                    ...share,
                    permission
                  }
                : share
            )
          }
        })
      )

      toast({
        title: "Permissions updated",
        description: `Share permission set to ${permission}.`
      })
    },
    [toast]
  )

  const contextValue = useMemo(
    () => ({
      collections,
      savedPosts,
      isLoading,
      isRefreshing,
      error,
      refreshCollections,
      createCollection,
      updateCollection,
      deleteCollection,
      saveToCollection,
      removeFromCollection,
      getPostCollections,
      isSaved,
      shareCollection,
      getShareLink,
      removeShare,
      updateSharePermission
    }),
    [
      collections,
      savedPosts,
      isLoading,
      isRefreshing,
      error,
      refreshCollections,
      createCollection,
      updateCollection,
      deleteCollection,
      saveToCollection,
      removeFromCollection,
      getPostCollections,
      isSaved,
      shareCollection,
      getShareLink,
      removeShare,
      updateSharePermission
    ]
  )

  return <CollectionsContext.Provider value={contextValue}>{children}</CollectionsContext.Provider>
}

export function useCollections() {
  const context = useContext(CollectionsContext)
  if (context === undefined) {
    throw new Error("useCollections must be used within a CollectionsProvider")
  }
  return context
}

export type { Collection, CollectionShare }
