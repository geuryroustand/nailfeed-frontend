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
import { getCollectionPlaceholder } from "@/lib/collection-placeholder"
import { cn } from "@/lib/utils"

interface CollectionListItemProps {
  collection: Collection
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CollectionListItem({ collection, onView, onEdit, onDelete }: CollectionListItemProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const placeholder = getCollectionPlaceholder(collection.name)

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
          <div
            className={cn("flex h-full w-full items-center justify-center", placeholder.containerClass)}
            style={placeholder.style}
            role="img"
            aria-label={placeholder.ariaLabel}
          >
            <span
              className={cn("text-xl font-semibold uppercase tracking-wide drop-shadow-sm", placeholder.textClass)}
            >
              {placeholder.initial}
            </span>
          </div>
        )}
      </div>

      <div className="flex-grow p-4 cursor-pointer" onClick={onView}>
        <div className="flex items-center">
          <h3 className="font-semibold">{collection.name}</h3>

          <div className="ml-3 flex gap-2">
            {collection.isPrivate ? (
              <div className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center border border-gray-200">
                <EyeOff className="h-3 w-3 mr-1.5" />
                Private
              </div>
            ) : (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center border border-pink-200">
                <Eye className="h-3 w-3 mr-1.5" />
                Public
              </div>
            )}

            {collection.isShared && (
              <div className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center border border-purple-200">
                <Share className="h-3 w-3 mr-1.5" />
                Shared
              </div>
            )}
          </div>
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
