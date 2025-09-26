"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Collection } from "@/types/collection"
import { Grid, List, SearchIcon, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCollectionPlaceholder } from "@/lib/collection-placeholder"

interface PublicCollectionsGalleryProps {
  collections: Collection[]
}

export default function PublicCollectionsGallery({ collections }: PublicCollectionsGalleryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return collections
    }

    const query = searchQuery.trim().toLowerCase()
    return collections.filter((collection) => {
      const nameMatch = collection.name?.toLowerCase().includes(query)
      const descriptionMatch = collection.description?.toLowerCase().includes(query)
      const ownerMatch = collection.owner?.username?.toLowerCase().includes(query)
      return Boolean(nameMatch || descriptionMatch || ownerMatch)
    })
  }, [collections, searchQuery])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search collections"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
            aria-label="Search collections"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500" aria-hidden>
            View
          </span>
          <div className="flex overflow-hidden rounded-md border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredCollections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-16 text-center">
          <h3 className="text-lg font-medium text-gray-800">No collections found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search to discover more inspiration.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} variant="list" />
          ))}
        </div>
      )}
    </div>
  )
}

interface CollectionCardProps {
  collection: Collection
  variant: "grid" | "list"
}

function CollectionCard({ collection, variant }: CollectionCardProps) {
  const href = `/collections/${collection.id}`
  const itemCountLabel = `${collection.postIds.length} ${collection.postIds.length === 1 ? "design" : "designs"}`

  if (variant === "list") {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-pink-200 hover:shadow-sm"
      >
        <div className="flex items-start gap-4">
          <CollectionThumbnail collection={collection} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{collection.name}</h3>
              <span className="text-xs font-medium uppercase tracking-wide text-pink-500">
                {itemCountLabel}
              </span>
            </div>
            {collection.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{collection.description}</p>
            )}
            <CollectionOwner ownerName={collection.owner?.username} />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-pink-200 hover:shadow-lg"
    >
      <CollectionThumbnail collection={collection} size="lg" />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{collection.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <CollectionOwner ownerName={collection.owner?.username} />
          <span className="font-medium text-pink-500">{itemCountLabel}</span>
        </div>
      </div>
    </Link>
  )
}

function CollectionThumbnail({
  collection,
  size,
}: {
  collection: Collection
  size: "md" | "lg"
}) {
  const heightClass = size === "lg" ? "h-48" : "h-24 w-24 flex-shrink-0"
  const radius = size === "lg" ? "rounded-t-xl" : "rounded-lg"
  const placeholder = getCollectionPlaceholder(collection.name)
  const textSize = size === "lg" ? "text-4xl" : "text-lg"

  if (!collection.coverImage) {
    return (
      <div
        className={cn("flex items-center justify-center", placeholder.containerClass, heightClass, radius)}
        style={placeholder.style}
        role="img"
        aria-label={placeholder.ariaLabel}
      >
        <span
          className={cn("font-semibold uppercase tracking-wide drop-shadow-sm", placeholder.textClass, textSize)}
        >
          {placeholder.initial}
        </span>
      </div>
    )
  }

  const imageElement = (
    <Image
      src={collection.coverImage}
      alt={collection.name}
      fill
      priority={false}
      className="object-cover"
    />
  )

  if (size === "lg") {
    return (
      <div className={cn("relative w-full", heightClass)}>
        <div className="absolute inset-0 overflow-hidden">
          {imageElement}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", heightClass)}>
      <div className={cn("absolute inset-0 overflow-hidden", radius)}>{imageElement}</div>
    </div>
  )
}

function CollectionOwner({ ownerName }: { ownerName?: string }) {
  if (!ownerName) {
    return null
  }

  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <Users className="h-3.5 w-3.5" aria-hidden />
      <span className="truncate" title={`Created by ${ownerName}`}>
        {ownerName}
      </span>
    </span>
  )
}
