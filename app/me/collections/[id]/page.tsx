"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Trash2,
  MoreHorizontal,
  Lock,
  Grid,
  Columns,
  Share2,
  Bookmark,
  Users,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import ShareCollectionModal from "@/components/share-collection-modal"
import { useCollections, type Collection } from "@/context/collections-context"
import { useToast } from "@/hooks/use-toast"
import type { Post as FeedPost } from "@/lib/post-data"
import { getPostById } from "@/lib/post-data"

interface Params {
  id?: string | string[]
}

export default function CollectionDetailPage() {
  const params = useParams<Params>()
  const collectionId = useMemo(() => {
    if (!params?.id) return undefined
    return Array.isArray(params.id) ? params.id[0] : params.id
  }, [params])

  const router = useRouter()
  const { toast } = useToast()
  const {
    collections,
    deleteCollection,
    removeFromCollection,
    refreshCollections,
    isLoading,
  } = useCollections()

  const [collection, setCollection] = useState<Collection | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("grid")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)
  const [hasRequestedRefresh, setHasRequestedRefresh] = useState(false)

  useEffect(() => {
    if (!collectionId) return

    if (isLoading) {
      return
    }

    const foundCollection = collections.find((item) => item.id === collectionId)

    if (foundCollection) {
      setCollection(foundCollection)
      return
    }

    if (!hasRequestedRefresh) {
      setHasRequestedRefresh(true)
      refreshCollections({ silent: false }).catch((error) => {
        console.error("Failed to refresh collections:", error)
      })
      return
    }

    toast({
      title: "Collection not found",
      description: "We couldn't find that collection.",
      variant: "destructive",
    })
    router.replace("/me/collections")
  }, [collectionId, collections, hasRequestedRefresh, isLoading, refreshCollections, router, toast])

  useEffect(() => {
    let isCancelled = false

    const loadPosts = async (targetCollection: Collection) => {
      if (targetCollection.postIds.length === 0) {
        if (!isCancelled) {
          setPosts([])
          setPostsError(null)
          setIsLoadingPosts(false)
        }
        return
      }

      setIsLoadingPosts(true)
      setPostsError(null)

      try {
        const results = await Promise.all(
          targetCollection.postIds.map(async (postId) => {
            const identifier = typeof postId === "string" ? postId : postId?.toString()
            if (!identifier) {
              return null
            }

            try {
              const post = await getPostById(identifier)
              return post
            } catch (error) {
              console.error(`Failed to fetch post ${identifier}:`, error)
              return null
            }
          }),
        )

        if (isCancelled) return

        const postsById = new Map<string, FeedPost>()
        for (const post of results) {
          if (post) {
            if (post.documentId) {
              postsById.set(post.documentId, post)
            }

            if (typeof post.id === "number" && Number.isFinite(post.id)) {
              postsById.set(post.id.toString(), post)
            } else if (typeof post.id === "string" && post.id.length > 0) {
              postsById.set(post.id, post)
            }
          }
        }

        const orderedPosts = targetCollection.postIds
          .map((id) => {
            const key = typeof id === "string" ? id : id?.toString()
            return key ? postsById.get(key) : undefined
          })
          .filter((post): post is FeedPost => Boolean(post))

        setPosts(orderedPosts)
      } catch (error) {
        console.error("Failed to load collection posts:", error)
        if (!isCancelled) {
          setPosts([])
          setPostsError("We couldn't load posts for this collection. Please try again later.")
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPosts(false)
        }
      }
    }

    if (collection) {
      loadPosts(collection)
    } else {
      setPosts([])
      setPostsError(null)
      setIsLoadingPosts(false)
    }

    return () => {
      isCancelled = true
    }
  }, [collection])

  const handleDeleteCollection = useCallback(async () => {
    if (!collection) return

    try {
      const result = await deleteCollection(collection.id)

      if (!result?.success) {
        throw new Error(result?.message || "Failed to delete collection")
      }

      toast({
        title: "Collection deleted",
        description: `"${collection.name}" has been removed.`,
      })
      router.push("/me/collections")
    } catch (error) {
      console.error("Failed to delete collection:", error)
      toast({
        title: "Unable to delete collection",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    }
  }, [collection, deleteCollection, router, toast])

  const handleRemovePost = useCallback(
    async (postId: string) => {
      if (!collection) return

      try {
        await removeFromCollection(postId, collection.id)

        setCollection((prev) =>
          prev
            ? {
                ...prev,
                postIds: prev.postIds.filter((id) => id !== postId),
              }
            : prev,
        )
        setPosts((prev) =>
          prev.filter((post) => {
            const byDocument = post.documentId && post.documentId === postId
            const byNumericId = typeof post.id !== "undefined" && post.id !== null
              ? String(post.id) === postId
              : false

            return !byDocument && !byNumericId
          }),
        )
        setSelectedPostId(null)
        toast({
          title: "Removed from collection",
          description: "The post is no longer part of this collection.",
        })
      } catch (error) {
        console.error("Failed to remove post from collection:", error)
        toast({
          title: "Unable to remove post",
          description: "Please try again in a moment.",
          variant: "destructive",
        })
      }
    },
    [collection, removeFromCollection, toast],
  )

  const totalItems = collection?.postIds.length ?? 0
  const savedPostsCount = posts.length
  const hasPosts = totalItems > 0

  const mainContent = collection ? (
    <div className="container max-w-4xl mx-auto px-4 pt-2 pb-16 md:py-8">
      <div className="flex items-center mb-6">
        <Link href="/me/collections" className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">{collection.name}</h1>
            {collection.isPrivate && (
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs py-1 px-2 rounded-full flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </span>
            )}
            {collection.isShared && (
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs py-1 px-2 rounded-full flex items-center">
                <Users className="h-3 w-3 mr-1" />
                Shared
              </span>
            )}
          </div>
          {collection.description && <p className="text-gray-500 mt-1">{collection.description}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowShareModal(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share collection
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-500">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {totalItems} {totalItems === 1 ? "item" : "items"}
          {savedPostsCount !== totalItems && ` • ${savedPostsCount} visible`}
        </p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "masonry" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("masonry")}
            >
              <Columns className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          {!hasPosts ? (
            <EmptyCollectionState onExplore={() => router.push("/")} />
          ) : isLoadingPosts ? (
            <LoadingPostsState />
          ) : postsError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {postsError}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">We couldn't display the posts in this collection right now.</p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                  : "columns-2 md:columns-3 gap-4 space-y-4"
              }
            >
              {posts.map((post) => (
                <CollectionPostItem
                  key={post.documentId ?? post.id}
                  post={post}
                  viewMode={viewMode}
                  onRemove={() => {
                    const identifier = post.documentId || (post.id != null ? String(post.id) : null)
                    if (!identifier) {
                      return
                    }

                    setSelectedPostId(identifier)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex items-center text-sm text-gray-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-pink-500" />
        Loading collection...
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Sidebar activeItem="profile" />
        </div>

        <div className="w-full md:pl-64 lg:pl-72">
          {mainContent}
        </div>
      </div>

      <div className="md:hidden">
        <BottomNav activeTab="profile" />
      </div>

      <Toaster />

      {collection && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Collection</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete "{collection.name}"? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCollection}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {collection && (
        <Dialog open={!!selectedPostId} onOpenChange={() => setSelectedPostId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove from Collection</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to remove this item from "{collection.name}"?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPostId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedPostId && handleRemovePost(selectedPostId)}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {collection && showShareModal && (
        <ShareCollectionModal collection={collection} onClose={() => setShowShareModal(false)} />
      )}
    </main>
  )
}

function EmptyCollectionState({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Bookmark className="h-8 w-8 text-gray-300" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No items in this collection</h2>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Browse the app and save your favorite nail designs to this collection.
      </p>
      <Button
        onClick={onExplore}
        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
      >
        Explore designs
      </Button>
    </div>
  )
}

function LoadingPostsState() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-gray-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-pink-500" />
      Loading posts...
    </div>
  )
}

interface CollectionPostItemProps {
  post: FeedPost
  viewMode: "grid" | "masonry"
  onRemove: () => void
}

function CollectionPostItem({ post, viewMode, onRemove }: CollectionPostItemProps) {
  const imageUrl =
    post.mediaItems?.[0]?.url || post.media?.[0]?.url || post.image || "/placeholder.svg"
  const postHref = post.documentId ? `/post/${post.documentId}` : `/post/${post.id}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group relative rounded-lg ${viewMode === "masonry" ? "mb-4 break-inside-avoid" : ""}`}
    >
      <Link href={postHref}>
        <div className="relative overflow-hidden rounded-lg bg-gray-100">
          <img
            src={imageUrl}
            alt={post.description || "Collection post"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
            <div className="flex h-full items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onRemove()
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {post.description || "Untitled design"}
          </p>
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <span>@{post.username || "unknown"}</span>
            {post.likesCount ? <span className="ml-2">• {post.likesCount} likes</span> : null}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

