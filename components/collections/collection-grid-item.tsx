"use client"

import Image from "next/image"
import { useState } from "react"
import type { Collection } from "@/types/collection"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
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

interface CollectionGridItemProps {
  collection: Collection
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CollectionGridItem({ collection, onView, onEdit, onDelete }: CollectionGridItemProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      onDelete()
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 cursor-pointer" onClick={onView}>
        {collection.coverImage ? (
          <Image
            src={collection.coverImage || "/placeholder.svg"}
            alt={collection.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No cover image</span>
          </div>
        )}

        {collection.isPrivate && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <EyeOff className="h-3 w-3 mr-1" />
            Private
          </div>
        )}

        {collection.isShared && (
          <div className="absolute top-2 left-2 bg-blue-500/70 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <Share className="h-3 w-3 mr-1" />
            Shared
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold truncate" onClick={onView}>
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{collection.description}</p>
            )}
          </div>

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
      </CardContent>

      <CardFooter className="p-4 pt-0 text-sm text-gray-500">
        {collection.postIds.length} {collection.postIds.length === 1 ? "item" : "items"}
      </CardFooter>

      {isShareModalOpen && <ShareCollectionModal collection={collection} onClose={() => setIsShareModalOpen(false)} />}
    </Card>
  )
}
