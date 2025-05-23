"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Heart, ImageIcon, MoreHorizontal, Trash2 } from "lucide-react"
import { ensureAbsoluteUrl } from "@/lib/api-url-helper"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { deletePost } from "@/lib/post-management-actions"

interface MediaItem {
  id: number | string
  type: string
  order: number
  file: {
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
}

interface Post {
  id: number
  documentId: string
  description: string
  contentType: string
  galleryLayout: string
  publishedAt: string
  likesCount: number
  commentsCount: number
  mediaItems: MediaItem[]
  userId?: string
  authorId?: string
  user?: {
    id: string
    documentId?: string
    username?: string
  }
  userDocumentId?: string
}

interface ProfileGalleryClientProps {
  posts: Post[]
  username: string
}

export function ProfileGalleryClient({ posts: initialPosts, username }: ProfileGalleryClientProps) {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [posts, setPosts] = useState<Post[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()

  // Determine if the current user is the profile owner
  const isOwnProfile = isAuthenticated && user?.username === username

  // Process posts when component mounts or posts change
  useEffect(() => {
    console.log(`ProfileGalleryClient: Processing ${initialPosts.length} posts`)

    // Deep clone the posts to avoid mutating props
    const postsWithMedia = initialPosts.map((post) => {
      // Ensure mediaItems is an array
      const mediaItems = Array.isArray(post.mediaItems) ? post.mediaItems : []

      return {
        ...post,
        mediaItems,
      }
    })

    setPosts(postsWithMedia)
  }, [initialPosts])

  // Function to get the best available image URL from a media item
  const getBestImageUrl = (mediaItem: MediaItem | undefined): string => {
    if (!mediaItem || !mediaItem.file) {
      return ""
    }

    // If formats are available, try to get the best size
    if (mediaItem.file.formats) {
      const url =
        mediaItem.file.formats.medium?.url ||
        mediaItem.file.formats.small?.url ||
        mediaItem.file.formats.thumbnail?.url ||
        mediaItem.file.url

      if (!url) {
        return ""
      }

      return ensureAbsoluteUrl(url)
    }

    // If no formats, use the main URL
    if (mediaItem.file.url) {
      return ensureAbsoluteUrl(mediaItem.file.url)
    }

    return ""
  }

  // Function to get the first media item for a post, sorted by order
  const getFirstMediaItem = (post: Post): MediaItem | undefined => {
    if (!post.mediaItems || !Array.isArray(post.mediaItems) || post.mediaItems.length === 0) {
      return undefined
    }

    // Sort media items by order and return the first one
    return [...post.mediaItems].sort((a, b) => (a.order || 0) - (b.order || 0))[0]
  }

  // Generate a dynamic placeholder URL based on post description
  const getPlaceholderUrl = (post: Post): string => {
    const query = encodeURIComponent(post.description || "nail art")
    return `/placeholder.svg?height=400&width=400&query=${query}`
  }

  // Function to check if the current user is the post owner
  const isPostOwner = (post: Post) => {
    if (!user) return false

    // Check various possible ID fields to determine ownership
    return (
      // Check numeric IDs
      (post.userId && user.id && post.userId.toString() === user.id.toString()) ||
      (post.authorId && user.id && post.authorId.toString() === user.id.toString()) ||
      (post.user?.id && user.id && post.user.id.toString() === user.id.toString()) ||
      // Check document IDs (Strapi v5 specific)
      (post.userDocumentId && user.documentId && post.userDocumentId === user.documentId) ||
      (post.user?.documentId && user.documentId && post.user.documentId === user.documentId) ||
      // Check username (fallback)
      (post.user?.username && user.username && post.user.username === user.username)
    )
  }

  // Function to handle delete button click
  const onDeleteClick = (post: Post) => {
    setSelectedPost(post)
    setDeleteError(null)
    setIsDeleteDialogOpen(true)
  }

  // Function to confirm post deletion
  const confirmDelete = async () => {
    if (!selectedPost) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deletePost(selectedPost.documentId)

      if (result.success) {
        // Remove the deleted post from the state
        setPosts((currentPosts) => currentPosts.filter((post) => post.id !== selectedPost.id))

        toast({
          title: "Post deleted",
          description: "Your post has been successfully removed.",
        })

        setIsDeleteDialogOpen(false)
      } else {
        setDeleteError(result.message || "Failed to delete post. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      setDeleteError("An unexpected error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Posts</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md ${view === "grid" ? "bg-gray-200" : "bg-transparent"}`}
            aria-label="Grid view"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md ${view === "list" ? "bg-gray-200" : "bg-transparent"}`}
            aria-label="List view"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts to display</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((post) => {
            const firstMediaItem = getFirstMediaItem(post)
            const imageUrl = getBestImageUrl(firstMediaItem)
            const placeholderUrl = getPlaceholderUrl(post)
            const canDelete = isOwnProfile || isPostOwner(post)

            return (
              <div key={post.id} className="relative group">
                <Link href={`/post/${post.documentId}`}>
                  <div className="relative aspect-square rounded-xl overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={post.description || "Post image"}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        onError={(e) => {
                          console.error("Image failed to load:", imageUrl)
                          const target = e.target as HTMLImageElement
                          target.src = placeholderUrl
                          target.onerror = null // Prevent infinite error loop
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="flex flex-col items-center text-gray-400">
                          <ImageIcon className="w-10 h-10 mb-2" />
                          <span className="text-sm">No image available</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center space-x-4 text-white">
                        <div className="flex items-center">
                          <Heart className="w-5 h-5 mr-1" />
                          <span>{post.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="w-5 h-5 mr-1" />
                          <span>{post.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Post actions dropdown - only visible for post owner */}
                {canDelete && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                        >
                          <MoreHorizontal className="h-4 w-4 text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500 focus:bg-red-50 flex items-center"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onDeleteClick(post)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const firstMediaItem = getFirstMediaItem(post)
            const imageUrl = getBestImageUrl(firstMediaItem)
            const placeholderUrl = getPlaceholderUrl(post)
            const canDelete = isOwnProfile || isPostOwner(post)

            return (
              <div key={post.id} className="relative group">
                <Link href={`/post/${post.documentId}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex space-x-4">
                      <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                        {imageUrl ? (
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={post.description || "Post image"}
                            fill
                            className="object-cover"
                            sizes="80px"
                            onError={(e) => {
                              console.error("Image failed to load:", imageUrl)
                              const target = e.target as HTMLImageElement
                              target.src = placeholderUrl
                              target.onerror = null // Prevent infinite error loop
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="line-clamp-2 text-sm">{post.description || "No description"}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <div className="flex items-center mr-4">
                            <Heart className="w-4 h-4 mr-1" />
                            <span>{post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            <span>{post.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Post actions for list view */}
                      {canDelete && (
                        <div className="flex items-start">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500 focus:bg-red-50 flex items-center"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onDeleteClick(post)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete post
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          // Only allow closing if not currently deleting
          if (!isDeleting) {
            setIsDeleteDialogOpen(open)
          }
        }}
        title="Delete Post"
        description={
          <div className="space-y-2">
            <div>Are you sure you want to delete this post? This action cannot be undone.</div>
            {deleteError && (
              <div className="text-red-500 text-sm flex items-center">
                <Trash2 className="h-4 w-4 mr-1" />
                {deleteError}
              </div>
            )}
          </div>
        }
        onConfirm={confirmDelete}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
        disabled={isDeleting}
      />
    </div>
  )
}
