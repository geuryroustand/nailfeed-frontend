"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useCollections, type Collection } from "@/context/collections-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Edit, Trash2, MoreHorizontal, Lock, Grid, Columns, Share2, Bookmark, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import ShareCollectionModal from "@/components/share-collection-modal"
import Link from "next/link"

// Sample posts data - in a real app, you would fetch this from an API
const allPosts = [
  {
    id: 1,
    username: "nailartist",
    userImage: "/serene-woman-gaze.png",
    image: "/glitter-french-elegance.png",
    description: "French manicure with a twist! ✨ Added some glitter for that extra sparkle. What do you think?",
    likes: 234,
    comments: [],
    timestamp: "2h ago",
  },
  {
    id: 2,
    username: "trendynails",
    userImage: "/painted-nails-close-up.png",
    image: "/geometric-harmony.png",
    description: "Geometric vibes today! 📐 These took forever but I'm so happy with how they turned out.",
    likes: 187,
    comments: [],
    timestamp: "5h ago",
  },
  {
    id: 3,
    username: "artsynails",
    userImage: "/diverse-avatars.png",
    image: "/vibrant-floral-nails.png",
    description: "Spring is in the air! 🌸 Loving these floral designs for the season.",
    likes: 312,
    comments: [],
    timestamp: "1d ago",
  },
  {
    id: 4,
    username: "nailpro",
    userImage: "/diverse-avatars.png",
    image: "/abstract-pastel-swirls.png",
    description: "Abstract art but make it nails 🎨 Pastel swirls are my current obsession!",
    likes: 156,
    comments: [],
    timestamp: "2d ago",
  },
  {
    id: 5,
    username: "nailpro",
    userImage: "/diverse-avatars.png",
    image: "/vibrant-abstract-nails.png",
    description: "Bold and bright abstract design for a client today! She loved it! 💅",
    likes: 278,
    comments: [],
    timestamp: "3d ago",
  },
  {
    id: 6,
    username: "luxurynails",
    userImage: "/painted-nails-close-up.png",
    image: "/shimmering-gold-flakes.png",
    description: "Luxury gold flakes for a touch of elegance ✨ Perfect for special occasions!",
    likes: 423,
    comments: [],
    timestamp: "4d ago",
  },
]

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { collections, updateCollection, deleteCollection, removeFromCollection } = useCollections()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("grid")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    if (params.id) {
      const foundCollection = collections.find((c) => c.id === params.id)
      if (foundCollection) {
        setCollection(foundCollection)

        // Filter posts that are in this collection
        const collectionPosts = allPosts.filter((post) => foundCollection.postIds.includes(post.id))
        setPosts(collectionPosts)
      } else {
        // Collection not found, redirect to collections page
        router.push("/collections")
      }
    }
  }, [params.id, collections, router])

  const handleDeleteCollection = async () => {
    if (!collection) return

    await deleteCollection(collection.id)
    router.push("/collections")
  }

  const handleRemovePost = async (postId: number) => {
    if (!collection) return

    await removeFromCollection(postId, collection.id)
    setPosts(posts.filter((post) => post.id !== postId))
    setSelectedPostId(null)
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading collection...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Sidebar activeItem="profile" />
        </div>

        {/* Main Content */}
        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-4xl mx-auto px-4 pt-2 pb-16 md:py-8">
            <div className="flex items-center mb-6">
              <Link href="/collections" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold">{collection.name}</h1>
                  {collection.isPrivate && (
                    <div className="ml-2 bg-gray-100 text-gray-600 text-xs py-1 px-2 rounded-full flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </div>
                  )}
                  {collection.isShared && (
                    <div className="ml-2 bg-blue-100 text-blue-600 text-xs py-1 px-2 rounded-full flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Shared
                    </div>
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
                  <DropdownMenuItem asChild>
                    <Link href={`/collections/edit/${collection.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit collection
                    </Link>
                  </DropdownMenuItem>
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
                {collection.postIds.length} {collection.postIds.length === 1 ? "item" : "items"}
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
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${viewMode === "grid" ? "bg-white text-pink-500 shadow-sm" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${viewMode === "masonry" ? "bg-white text-pink-500 shadow-sm" : ""}`}
                    onClick={() => setViewMode("masonry")}
                  >
                    <Columns className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Bookmark className="h-8 w-8 text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No items in this collection</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Browse the app and save your favorite nail designs to this collection
                </p>
                <Button
                  onClick={() => router.push("/")}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  Explore designs
                </Button>
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
                    key={post.id}
                    post={post}
                    viewMode={viewMode}
                    onRemove={() => setSelectedPostId(post.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="profile" />
      </div>

      {/* Delete Collection Confirmation Dialog */}
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

      {/* Remove Post Confirmation Dialog */}
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
            <Button variant="destructive" onClick={() => selectedPostId && handleRemovePost(selectedPostId)}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Collection Modal */}
      {showShareModal && <ShareCollectionModal collection={collection} onClose={() => setShowShareModal(false)} />}

      <Toaster />
    </main>
  )
}

interface CollectionPostItemProps {
  post: any
  viewMode: "grid" | "masonry"
  onRemove: () => void
}

function CollectionPostItem({ post, viewMode, onRemove }: CollectionPostItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative group rounded-lg overflow-hidden ${viewMode === "masonry" ? "mb-4 break-inside-avoid" : ""}`}
    >
      <Link href={`/post/${post.id}`}>
        <img
          src={post.image || "/placeholder.svg"}
          alt={post.description}
          className="w-full h-full object-cover aspect-square"
        />
      </Link>

      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
