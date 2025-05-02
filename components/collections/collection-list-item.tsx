"use client"

import { useState } from "react"
import Image from "next/image"
import type { Collection } from "@/types/collection"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, MoreHorizontal, Edit, Trash, Share } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ShareCollectionModal from "@/components/share-collection-modal"

interface CollectionListItemProps {
  collection: Collection
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CollectionListItem({ collection, onView, onEdit, onDelete }: CollectionListItemProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      onDelete()
    }
  }

  return (
    <div className="flex items-center border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
      <div className="relative h-20 w-20 flex-shrink-0 cursor-pointer" onClick={onView}>
        {collection.coverImage ? (
          <Image
            src={collection.coverImage || "/placeholder.svg"}
            alt={collection.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
      </div>

      <div className="flex-grow p-4 cursor-pointer" onClick={onView}>
        <div className="flex items-center">
          <h3 className="font-semibold">{collection.name}</h3>

          {collection.isPrivate && (
            <div className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs flex items-center">
              <EyeOff className="h-3 w-3 mr-1" />
              Private
            </div>
          )}

          {collection.isShared && (
            <div className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs flex items-center">
              <Share className="h-3 w-3 mr-1" />
              Shared
            </div>
          )}
        </div>

        {collection.description && <p className="text-sm text-gray-500 line-clamp-1 mt-1">{collection.description}</p>}

        <div className="text-xs text-gray-500 mt-1">
          {collection.postIds.length} {collection.postIds.length === 1 ? "item" : "items"} • Created{" "}
          {new Date(collection.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isShareModalOpen && <ShareCollectionModal collection={collection} onClose={() => setIsShareModalOpen(false)} />}
    </div>
  )
}
