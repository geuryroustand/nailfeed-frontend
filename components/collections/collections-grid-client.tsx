"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import CollectionFormModal from "./collection-form-modal"
import type { Collection } from "@/types/collection"
import CollectionGridItem from "./collection-grid-item"
import CollectionListItem from "./collection-list-item"
import { useCollectionsContext } from "./collections-layout"
import { useToast } from "@/hooks/use-toast"
import { createCollection, updateCollection, deleteCollection } from "@/lib/actions/collections-server-actions"

interface CollectionsGridClientProps {
  initialCollections: Collection[]
}

export default function CollectionsGridClient({ initialCollections }: CollectionsGridClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const {
    viewMode,
    searchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedCollection,
    setSelectedCollection,
    setSearchQuery,
  } = useCollectionsContext()

  const [collections, setCollections] = useState<Collection[]>(initialCollections)

  // Memoized filtered collections for better performance
  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections

    const lowercaseQuery = searchQuery.toLowerCase()
    return collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(lowercaseQuery) ||
        (collection.description && collection.description.toLowerCase().includes(lowercaseQuery)),
    )
  }, [searchQuery, collections])

  // Handle create collection
  const handleCreateCollection = async (name: string, description: string, isPrivate: boolean) => {
    try {
      const result = await createCollection(name, description, isPrivate)

      if (result.success && result.collection) {
        setCollections((prev) => [...prev, result.collection!])
        toast({
          title: "Collection created",
          description: `"${name}" has been created successfully.`,
        })
      } else {
        throw new Error(result.message)
      }
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
    router.push(`/collections/${id}`)
  }

  // Handle edit button click
  const handleEditClick = (collection: Collection) => {
    setSelectedCollection(collection)
    setIsEditModalOpen(true)
  }

  // Show search results message
  if (filteredCollections.length === 0 && searchQuery) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No collections found matching "{searchQuery}"</p>
        <button onClick={() => setSearchQuery("")} className="text-blue-600 hover:text-blue-800 mt-2">
          Clear search
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Collections display */}
      {viewMode === "grid" ? (
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

      {isCreateModalOpen && (
        <CollectionFormModal
          mode="create"
          onSubmit={handleCreateCollection}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      )}

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
    </>
  )
}
