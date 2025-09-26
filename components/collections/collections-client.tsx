"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Collection } from "@/types/collection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Grid, List, Plus, SearchIcon } from "lucide-react"
import CollectionGridItem from "./collection-grid-item"
import CollectionListItem from "./collection-list-item"
import CollectionFormModal from "./collection-form-modal"
import EmptyCollectionsState from "./empty-collections-state"
import { useCollections } from "@/context/collections-context"
import { uploadFiles } from "@/lib/services/client-upload-service"
import { useToast } from "@/hooks/use-toast"
import { normalizeImageUrl } from "@/lib/image-utils"

interface CollectionsClientProps {
  initialCollections: Collection[]
}

export default function CollectionsClient({ initialCollections }: CollectionsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { createCollection, updateCollection, deleteCollection } = useCollections()

  // State
  const [collections, setCollections] = useState<Collection[]>(initialCollections)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>(collections)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem("collectionsViewMode")
    if (savedViewMode === "grid" || savedViewMode === "list") {
      setViewMode(savedViewMode)
    }
  }, [])

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("collectionsViewMode", viewMode)
  }, [viewMode])

  // Filter collections based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCollections(collections)
      return
    }

    const lowercaseQuery = searchQuery.toLowerCase()
    const filtered = collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(lowercaseQuery) ||
        (collection.description && collection.description.toLowerCase().includes(lowercaseQuery)),
    )
    setFilteredCollections(filtered)
  }, [searchQuery, collections])

  // Handle create collection
  const handleCreateCollection = async (
    name: string,
    description: string,
    isPrivate: boolean,
    coverImageFile?: File | null,
  ) => {
    try {
      let coverImageId: number | undefined
      let coverImageUrl: string | undefined
      if (coverImageFile) {
        const uploaded = await uploadFiles([coverImageFile])
        if (!uploaded.success || !uploaded.files?.[0]) {
          throw new Error(uploaded.error || "Failed to upload cover image")
        }
        const uploadedFile = uploaded.files[0]
        coverImageId = uploadedFile.id
        coverImageUrl = normalizeImageUrl(uploadedFile.url)
      }

      const newCollection = await createCollection(name, description, isPrivate, coverImageId)

      // Optimistically update the UI
      const hydratedCollection =
        coverImageUrl && !newCollection.coverImage
          ? { ...newCollection, coverImage: coverImageUrl }
          : newCollection

      setCollections((prev) => [...prev, hydratedCollection])

      toast({
        title: "Collection created",
        description: `"${name}" has been created successfully.`,
      })
    } catch (error) {
      console.error("Error creating collection:", error)
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreateModalOpen(false)
    }
  }

  // Handle edit collection
  const handleEditCollection = async (id: string, data: Partial<Collection>) => {
    try {
      const result = await updateCollection(id, data)

      if (result.success) {
        // Optimistically update the UI
        setCollections((prev) =>
          prev.map((collection) =>
            collection.id === id ? { ...collection, ...data, updatedAt: new Date().toISOString() } : collection,
          ),
        )

        toast({
          title: "Collection updated",
          description: `"${data.name || selectedCollection?.name}" has been updated.`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error updating collection:", error)
      toast({
        title: "Error",
        description: "Failed to update collection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEditModalOpen(false)
      setSelectedCollection(null)
    }
  }

  // Handle delete collection
  const handleDeleteCollection = async (id: string) => {
    try {
      const result = await deleteCollection(id)

      if (result.success) {
        // Optimistically update the UI
        setCollections((prev) => prev.filter((collection) => collection.id !== id))

        toast({
          title: "Collection deleted",
          description: "Collection has been deleted.",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error deleting collection:", error)
      toast({
        title: "Error",
        description: "Failed to delete collection. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle view collection
  const handleViewCollection = (id: string) => {
    router.push(`/me/collections/${id}`)
  }

  // Handle edit button click
  const handleEditClick = (collection: Collection) => {
    setSelectedCollection(collection)
    setIsEditModalOpen(true)
  }

  return (
    <div>
      {/* Header with search and view controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Collections display */}
      {collections.length === 0 ? (
        <EmptyCollectionsState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : filteredCollections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No collections found matching "{searchQuery}"</p>
          <Button variant="link" onClick={() => setSearchQuery("")}>
            Clear search
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <CollectionGridItem
              key={collection.id}
              collection={collection}
              onView={() => handleViewCollection(collection.id)}
              onEdit={() => handleEditClick(collection)}
              onDelete={() => handleDeleteCollection(collection.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCollections.map((collection) => (
            <CollectionListItem
              key={collection.id}
              collection={collection}
              onView={() => handleViewCollection(collection.id)}
              onEdit={() => handleEditClick(collection)}
              onDelete={() => handleDeleteCollection(collection.id)}
            />
          ))}
        </div>
      )}

      {/* Create collection modal */}
      {isCreateModalOpen && (
        <CollectionFormModal
          mode="create"
          onSubmit={handleCreateCollection}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Edit collection modal */}
      {isEditModalOpen && selectedCollection && (
        <CollectionFormModal
          mode="edit"
          collection={selectedCollection}
          onSubmit={(name, description, isPrivate) =>
            handleEditCollection(selectedCollection.id, { name, description, isPrivate })
          }
          onCancel={() => {
            setIsEditModalOpen(false)
            setSelectedCollection(null)
          }}
        />
      )}
    </div>
  )
}
