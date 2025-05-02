"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

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

export interface Post {
  id: number
  username: string
  userImage: string
  image: string
  description: string
  likes: number
  comments: any[]
  timestamp: string
  tags?: string[]
}

interface CollectionsContextType {
  collections: Collection[]
  savedPosts: Record<number, boolean>
  createCollection: (name: string, description?: string, isPrivate?: boolean) => Promise<Collection>
  updateCollection: (id: string, data: Partial<Collection>) => Promise<Collection>
  deleteCollection: (id: string) => Promise<void>
  saveToCollection: (postId: number, collectionId: string) => Promise<void>
  removeFromCollection: (postId: number, collectionId: string) => Promise<void>
  getPostCollections: (postId: number) => Collection[]
  isSaved: (postId: number) => boolean
  shareCollection: (
    collectionId: string,
    shareType: "link" | "user" | "social",
    options?: {
      recipient?: string
      permission?: "view" | "edit"
      expiresAt?: string
    },
  ) => Promise<CollectionShare>
  getShareLink: (collectionId: string) => Promise<string>
  removeShare: (collectionId: string, shareId: string) => Promise<void>
  updateSharePermission: (collectionId: string, shareId: string, permission: "view" | "edit") => Promise<void>
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined)

// Sample initial collections
const initialCollections: Collection[] = [
  {
    id: "1",
    name: "For my birthday",
    description: "Nail designs I'm considering for my birthday celebration",
    coverImage: "/vibrant-abstract-nails.png",
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postIds: [1, 3],
    shares: [],
  },
  {
    id: "2",
    name: "Christmas ideas",
    description: "Festive nail art for the holiday season",
    coverImage: "/glitter-french-elegance.png",
    isPrivate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postIds: [2, 5],
    shares: [],
  },
  {
    id: "3",
    name: "Summer",
    description: "Bright and colorful designs for summer",
    coverImage: "/vibrant-floral-nails.png",
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postIds: [4, 6],
    shares: [],
  },
]

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [savedPosts, setSavedPosts] = useState<Record<number, boolean>>({})
  const { toast } = useToast()

  // Load collections from localStorage on mount
  useEffect(() => {
    const storedCollections = localStorage.getItem("collections")
    const storedSavedPosts = localStorage.getItem("savedPosts")

    if (storedCollections) {
      setCollections(JSON.parse(storedCollections))
    } else {
      // Use initial collections if none exist
      setCollections(initialCollections)
      localStorage.setItem("collections", JSON.stringify(initialCollections))
    }

    if (storedSavedPosts) {
      setSavedPosts(JSON.parse(storedSavedPosts))
    } else {
      // Initialize saved posts based on initial collections
      const saved: Record<number, boolean> = {}
      initialCollections.forEach((collection) => {
        collection.postIds.forEach((postId) => {
          saved[postId] = true
        })
      })
      setSavedPosts(saved)
      localStorage.setItem("savedPosts", JSON.stringify(saved))
    }
  }, [])

  // Save collections to localStorage whenever they change
  useEffect(() => {
    if (collections.length > 0) {
      localStorage.setItem("collections", JSON.stringify(collections))
    }
  }, [collections])

  // Save savedPosts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("savedPosts", JSON.stringify(savedPosts))
  }, [savedPosts])

  const createCollection = async (name: string, description?: string, isPrivate = false): Promise<Collection> => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      description,
      isPrivate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      postIds: [],
      shares: [],
    }

    setCollections((prev) => [...prev, newCollection])

    toast({
      title: "Collection created",
      description: `"${name}" has been created successfully.`,
    })

    return newCollection
  }

  const updateCollection = async (id: string, data: Partial<Collection>): Promise<Collection> => {
    let updatedCollection: Collection | undefined

    setCollections((prev) =>
      prev.map((collection) => {
        if (collection.id === id) {
          updatedCollection = {
            ...collection,
            ...data,
            updatedAt: new Date().toISOString(),
          }
          return updatedCollection
        }
        return collection
      }),
    )

    if (!updatedCollection) {
      throw new Error("Collection not found")
    }

    toast({
      title: "Collection updated",
      description: `"${updatedCollection.name}" has been updated.`,
    })

    return updatedCollection
  }

  const deleteCollection = async (id: string): Promise<void> => {
    const collection = collections.find((c) => c.id === id)
    if (!collection) {
      throw new Error("Collection not found")
    }

    setCollections((prev) => prev.filter((collection) => collection.id !== id))

    // Update savedPosts state by removing posts that are only in this collection
    const postsToRemove = collection.postIds.filter((postId) => {
      return !collections.filter((c) => c.id !== id).some((c) => c.postIds.includes(postId))
    })

    if (postsToRemove.length > 0) {
      setSavedPosts((prev) => {
        const updated = { ...prev }
        postsToRemove.forEach((postId) => {
          delete updated[postId]
        })
        return updated
      })
    }

    toast({
      title: "Collection deleted",
      description: `"${collection.name}" has been deleted.`,
    })
  }

  const saveToCollection = async (postId: number, collectionId: string): Promise<void> => {
    setCollections((prev) =>
      prev.map((collection) => {
        if (collection.id === collectionId && !collection.postIds.includes(postId)) {
          return {
            ...collection,
            postIds: [...collection.postIds, postId],
            updatedAt: new Date().toISOString(),
          }
        }
        return collection
      }),
    )

    setSavedPosts((prev) => ({
      ...prev,
      [postId]: true,
    }))

    const collection = collections.find((c) => c.id === collectionId)
    toast({
      title: "Saved to collection",
      description: `Post saved to "${collection?.name || "collection"}"`,
    })
  }

  const removeFromCollection = async (postId: number, collectionId: string): Promise<void> => {
    setCollections((prev) =>
      prev.map((collection) => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            postIds: collection.postIds.filter((id) => id !== postId),
            updatedAt: new Date().toISOString(),
          }
        }
        return collection
      }),
    )

    // Check if the post exists in any other collections
    const existsInOtherCollections = collections.some((c) => c.id !== collectionId && c.postIds.includes(postId))

    if (!existsInOtherCollections) {
      setSavedPosts((prev) => {
        const updated = { ...prev }
        delete updated[postId]
        return updated
      })
    }

    const collection = collections.find((c) => c.id === collectionId)
    toast({
      title: "Removed from collection",
      description: `Post removed from "${collection?.name || "collection"}"`,
    })
  }

  const getPostCollections = (postId: number): Collection[] => {
    return collections.filter((collection) => collection.postIds.includes(postId))
  }

  const isSaved = (postId: number): boolean => {
    return !!savedPosts[postId]
  }

  // New sharing functions
  const shareCollection = async (
    collectionId: string,
    shareType: "link" | "user" | "social",
    options?: {
      recipient?: string
      permission?: "view" | "edit"
      expiresAt?: string
    },
  ): Promise<CollectionShare> => {
    const collection = collections.find((c) => c.id === collectionId)
    if (!collection) {
      throw new Error("Collection not found")
    }

    // Create a new share
    const newShare: CollectionShare = {
      id: Date.now().toString(),
      collectionId,
      type: shareType,
      recipient: options?.recipient,
      permission: options?.permission || "view",
      createdAt: new Date().toISOString(),
      expiresAt: options?.expiresAt,
      isActive: true,
    }

    // Update the collection with the new share
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId) {
          return {
            ...c,
            shares: [...c.shares, newShare],
            isShared: true,
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      }),
    )

    toast({
      title: "Collection shared",
      description:
        shareType === "link"
          ? "Collection link created and copied to clipboard"
          : `Collection shared with ${options?.recipient || "others"}`,
    })

    return newShare
  }

  const getShareLink = async (collectionId: string): Promise<string> => {
    const collection = collections.find((c) => c.id === collectionId)
    if (!collection) {
      throw new Error("Collection not found")
    }

    // Generate a share link if it doesn't exist
    if (!collection.shareLink) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const shareLink = `${baseUrl}/shared/collection/${collectionId}?token=${Date.now().toString(36)}`

      setCollections((prev) =>
        prev.map((c) => {
          if (c.id === collectionId) {
            return {
              ...c,
              shareLink,
              updatedAt: new Date().toISOString(),
            }
          }
          return c
        }),
      )

      return shareLink
    }

    return collection.shareLink
  }

  const removeShare = async (collectionId: string, shareId: string): Promise<void> => {
    const collection = collections.find((c) => c.id === collectionId)
    if (!collection) {
      throw new Error("Collection not found")
    }

    // Remove the share
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId) {
          const updatedShares = c.shares.filter((share) => share.id !== shareId)
          return {
            ...c,
            shares: updatedShares,
            isShared: updatedShares.length > 0,
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      }),
    )

    toast({
      title: "Share removed",
      description: "The collection is no longer shared with this user",
    })
  }

  const updateSharePermission = async (
    collectionId: string,
    shareId: string,
    permission: "view" | "edit",
  ): Promise<void> => {
    const collection = collections.find((c) => c.id === collectionId)
    if (!collection) {
      throw new Error("Collection not found")
    }

    // Update the share permission
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId) {
          return {
            ...c,
            shares: c.shares.map((share) => {
              if (share.id === shareId) {
                return {
                  ...share,
                  permission,
                }
              }
              return share
            }),
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      }),
    )

    toast({
      title: "Permissions updated",
      description: `Share permissions updated to ${permission}`,
    })
  }

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        savedPosts,
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
        updateSharePermission,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  )
}

export function useCollections() {
  const context = useContext(CollectionsContext)
  if (context === undefined) {
    throw new Error("useCollections must be used within a CollectionsProvider")
  }
  return context
}
