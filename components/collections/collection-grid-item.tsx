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
import { getCollectionPlaceholder } from "@/lib/collection-placeholder"
import { cn } from "@/lib/utils"

interface CollectionGridItemProps {
  collection: Collection
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CollectionGridItem({ collection, onView, onEdit, onDelete }: CollectionGridItemProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const placeholder = getCollectionPlaceholder(collection.name)

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
          <div
            className={cn("flex h-full w-full items-center justify-center", placeholder.containerClass)}
            style={placeholder.style}
            role="img"
            aria-label={placeholder.ariaLabel}
          >
            <span
              className={cn("text-4xl font-semibold uppercase tracking-wide drop-shadow-sm", placeholder.textClass)}
            >
              {placeholder.initial}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {collection.isPrivate ? (
            <div className="bg-gray-900/80 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center backdrop-blur-sm border border-white/20">
              <EyeOff className="h-3 w-3 mr-1.5" />
              Private
            </div>
          ) : (
            <div className="bg-gradient-to-r from-pink-500/90 to-purple-500/90 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center backdrop-blur-sm border border-white/20">
              <Eye className="h-3 w-3 mr-1.5" />
              Public
            </div>
          )}

          {collection.isShared && (
            <div className="bg-purple-600/90 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center backdrop-blur-sm border border-white/20">
              <Share className="h-3 w-3 mr-1.5" />
              Shared
            </div>
          )}
        </div>
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
