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
      <div className="rounded-3xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <Input
              placeholder="Search collections"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 rounded-full border-none bg-gray-100 pl-11 text-sm text-gray-700 shadow-inner focus-visible:ring-2 focus-visible:ring-pink-400"
              aria-label="Search collections"
            />
          </div>
          <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400" aria-hidden>
              View
            </p>
            <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white shadow-inner">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  viewMode === "grid"
                    ? "bg-pink-500 text-white hover:bg-pink-500"
                    : "text-gray-500 hover:bg-gray-100"
                )}
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                aria-label="Show collections in a grid"
              >
                <Grid className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  viewMode === "list"
                    ? "bg-pink-500 text-white hover:bg-pink-500"
                    : "text-gray-500 hover:bg-gray-100"
                )}
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                aria-label="Show collections in a list"
              >
                <List className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500" role="status" aria-live="polite">
          Showing {filteredCollections.length} of {collections.length} collections
        </p>
      </div>

      {filteredCollections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white/60 px-6 py-16 text-center shadow-sm">
          <h3 className="text-lg font-medium text-gray-800">No collections found</h3>
          <p className="mt-2 text-sm text-gray-500">Try adjusting your search to discover more inspiration.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
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
  const itemCount = collection.postIds.length
  const itemCountLabel = `${itemCount} ${itemCount === 1 ? "design" : "designs"}`
  const title = collection.name || "Untitled collection"
  const description = collection.description?.trim()

  if (variant === "list") {
    return (
      <Link
        href={href}
        aria-label={`View ${title}`}
        className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <article className="flex items-start gap-5 rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-28px_rgba(236,72,153,0.45)]">
          <CollectionThumbnail collection={collection} size="md" />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-pink-600">
                {title}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
                {itemCountLabel}
              </span>
            </div>
            {description && <p className="text-sm text-gray-600 line-clamp-2">{description}</p>}
            <CollectionOwner ownerName={collection.owner?.username} />
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      aria-label={`View ${title}`}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.45)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_35px_90px_-40px_rgba(236,72,153,0.45)]">
        <CollectionThumbnail collection={collection} size="lg" />
        <div className="flex flex-1 flex-col gap-3 p-6">
          <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-pink-600">
            {title}
          </h3>
          {description && <p className="text-sm text-gray-600 line-clamp-2">{description}</p>}
          <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
            <CollectionOwner ownerName={collection.owner?.username} />
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
              {itemCountLabel}
            </span>
          </div>
        </div>
      </article>
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
  const placeholder = getCollectionPlaceholder(collection.name)

  if (!collection.coverImage) {
    const baseClass =
      size === "lg"
        ? "relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-dashed border-pink-100 bg-gradient-to-br from-white via-rose-50 to-purple-50"
        : "relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-dashed border-pink-100 bg-gradient-to-br from-white via-rose-50 to-purple-50"

    return (
      <div
        className={cn("flex items-center justify-center", baseClass)}
        style={placeholder.style}
        role="img"
        aria-label={placeholder.ariaLabel}
      >
        <span className={cn("font-semibold uppercase tracking-wide text-pink-600", placeholder.textClass, size === "lg" ? "text-4xl" : "text-lg")}>
          {placeholder.initial}
        </span>
      </div>
    )
  }

  const imageAlt = collection.name || "Collection preview"
  const imageElement = (
    <Image
      src={collection.coverImage}
      alt={imageAlt}
      fill
      className="object-contain"
      sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
      priority={false}
    />
  )

  if (size === "lg") {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="absolute inset-0 overflow-hidden">{imageElement}</div>
      </div>
    )
  }

  return (
    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="absolute inset-0 overflow-hidden">{imageElement}</div>
    </div>
  )
}

function CollectionOwner({ ownerName }: { ownerName?: string }) {
  if (!ownerName) {
    return <span className="text-xs text-gray-400">By the community</span>
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
