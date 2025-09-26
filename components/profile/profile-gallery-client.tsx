"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { MessageSquare, Heart, ImageIcon, MoreHorizontal, Trash2, Type, BookmarkPlus } from "lucide-react"
import { ensureAbsoluteUrl } from "@/lib/api-url-helper"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth";
import { useCollections } from "@/context/collections-context"
import { deletePost } from "@/lib/post-management-actions"
import { MediaItem } from "@/components/media-item"
import { TextPostModal } from "@/components/text-post-modal";
import AddToCollectionDialog from "@/components/collections/add-to-collection-dialog";
import { cn } from "@/lib/utils"
import type { BackgroundType } from "@/components/post-background-selector"

interface Post {
  id: number
  documentId: string
  description: string
  contentType: string
  background?: BackgroundType
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
  const [textPostModalOpen, setTextPostModalOpen] = useState(false)
  const [selectedTextPost, setSelectedTextPost] = useState<Post | null>(null)
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const { isSaved } = useCollections()

  const isOwnProfile = isAuthenticated && user?.username === username

  useEffect(() => {
    console.log(`ProfileGalleryClient: Processing ${initialPosts.length} posts`)

    const postsWithMedia = initialPosts.map((post) => {
      const mediaItems = Array.isArray(post.mediaItems) ? post.mediaItems : []

      console.log(`[ProfileGalleryClient] Processing post ${post.id}:`, {
        id: post.id,
        contentType: post.contentType,
        originalMediaItems: post.mediaItems,
        processedMediaItems: mediaItems,
        mediaCount: mediaItems.length
      });

      return {
        ...post,
        mediaItems,
      }
    })

    setPosts(postsWithMedia)
  }, [initialPosts])

  const getBestImageUrl = (mediaItem: any): string => {
    if (!mediaItem) {
      console.log("[getBestImageUrl] No mediaItem provided");
      return ""
    }

    console.log("[getBestImageUrl] Processing mediaItem:", mediaItem);

    // Handle new optimized API structure where media comes directly with url
    if (mediaItem.url) {
      console.log("[getBestImageUrl] Using direct URL:", mediaItem.url);
      return ensureAbsoluteUrl(mediaItem.url)
    }

    // Handle legacy structure with file wrapper
    if (mediaItem.file) {
      if (mediaItem.file.formats) {
        const url =
          mediaItem.file.formats.medium?.url ||
          mediaItem.file.formats.small?.url ||
          mediaItem.file.formats.thumbnail?.url ||
          mediaItem.file.url

        if (url) {
          console.log("[getBestImageUrl] Using legacy file URL:", url);
          return ensureAbsoluteUrl(url)
        }
      }

      if (mediaItem.file.url) {
        console.log("[getBestImageUrl] Using legacy direct file URL:", mediaItem.file.url);
        return ensureAbsoluteUrl(mediaItem.file.url)
      }
    }

    console.log("[getBestImageUrl] No URL found");
    return ""
  }

  const getFirstMediaItem = (post: Post): any => {
    if (!post.mediaItems || !Array.isArray(post.mediaItems) || post.mediaItems.length === 0) {
      console.log("[getFirstMediaItem] No media items found for post:", post.id);
      return undefined
    }

    console.log("[getFirstMediaItem] Found media items:", post.mediaItems);
    const firstItem = [...post.mediaItems].sort((a, b) => (a.order || 0) - (b.order || 0))[0];
    console.log("[getFirstMediaItem] First media item:", firstItem);
    return firstItem;
  }

  const getPlaceholderUrl = (post: Post): string => {
    const query = encodeURIComponent(post.description || "nail art")
    return `/placeholder.svg?height=400&width=400&query=${query}`
  }
  const renderAddToCollectionButton = (post: Post) => {
    if (!isAuthenticated) return null

    const postIdentifier = post.documentId || (post.id != null ? String(post.id) : null)
    if (!postIdentifier) return null

    const saved = isSaved(postIdentifier)

    return (
      <div className="pointer-events-none absolute left-2 top-2 z-20">
        <AddToCollectionDialog
          postId={postIdentifier}
          postTitle={post.description}
          trigger={
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn(
                "pointer-events-auto h-8 w-8 rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white",
                saved && "bg-pink-500 text-white hover:bg-pink-500"
              )}
              onClick={(event) => event.stopPropagation()}
              aria-label={saved ? "Post already saved to your collections" : "Add post to collection"}
            >
              <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
        />
      </div>
    )
  }



  const isPostOwner = (post: Post) => {
    if (!user) return false

    return (
      (post.userId && user.id && post.userId.toString() === user.id.toString()) ||
      (post.authorId && user.id && post.authorId.toString() === user.id.toString()) ||
      (post.user?.id && user.id && post.user.id.toString() === user.id.toString()) ||
      (post.userDocumentId && user.documentId && post.userDocumentId === user.documentId) ||
      (post.user?.documentId && user.documentId && post.user.documentId === user.documentId) ||
      (post.user?.username && user.username && post.user.username === user.username)
    )
  }

  const onDeleteClick = (post: Post) => {
    setSelectedPost(post)
    setDeleteError(null)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedPost) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deletePost(selectedPost.documentId)

      if (result.success) {
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

  const isTextPost = (post: Post): boolean => {
    return (
      post.contentType === "text" || post.contentType === "text-background"
    )
  }

  const isMediaPost = (post: Post): boolean => {
    return (
      post.contentType === "image" ||
      post.contentType === "video" ||
      post.contentType === "media-gallery"
    )
  }

  const hasMediaItems = (post: Post): boolean => {
    return post.mediaItems && Array.isArray(post.mediaItems) && post.mediaItems.length > 0;
  }

  const handleTextPostClick = (post: Post, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedTextPost(post)
    setTextPostModalOpen(true)
  }

  const getTextColorForBackground = (post: Post) => {
    if (!post.background) return "text-gray-900"

    if (post.background.type === "color" || post.background.type === "gradient") {
      return "text-white"
    }

    return "text-gray-900"
  }

  const formatDescriptionWithHashtags = (description: string) => {
    if (!description) return null

    const parts = description.split(/(#\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span key={index} className="text-pink-500 font-medium">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-6">
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
            const isTextOnlyPost = isTextPost(post)
            const shouldShowMedia = isMediaPost(post) && hasMediaItems(post)

            console.log(`[ProfileGalleryClient] Post ${post.id} rendering:`, {
              contentType: post.contentType,
              isTextOnlyPost,
              shouldShowMedia,
              hasMediaItems: hasMediaItems(post),
              mediaItemsLength: post.mediaItems?.length || 0,
              firstMediaItem,
              imageUrl
            });

            return (
              <div key={post.id} className="relative group">
                {renderAddToCollectionButton(post)}
                {isTextOnlyPost ? (
                  <div className="cursor-pointer" onClick={(e) => handleTextPostClick(post, e)}>
                    <div className="relative aspect-square rounded-xl overflow-hidden">
                      {post.contentType === "text-background" && post.background ? (
                        <div
                          className={`w-full h-full flex items-center justify-center p-4 ${post.background.value} ${post.background.animation || ""}`}
                        >
                          <div
                            className={`text-sm font-medium text-center line-clamp-4 ${getTextColorForBackground(post)}`}
                          >
                            {formatDescriptionWithHashtags(post.description)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                          <div className="text-center">
                            <Type className="w-8 h-8 mb-2 text-gray-400 mx-auto" />
                            <div className="text-sm text-gray-700 line-clamp-4">
                              {formatDescriptionWithHashtags(post.description)}
                            </div>
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
                  </div>
                ) : (
                  <Link href={`/post/${post.documentId}`}>
                    <div className="relative aspect-square rounded-xl overflow-hidden">
                      {imageUrl ? (
                        <MediaItem
                          src={imageUrl}
                          alt={post.description || "Post media"}
                          type={firstMediaItem?.mime?.startsWith("video/") ? "video" : "image"}
                          objectFit="cover"
                          className="transition-transform group-hover:scale-105"
                          aspectRatio="square"
                          showControls={false}
                          onError={() => {
                            console.error("Media failed to load:", imageUrl)
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <div className="flex flex-col items-center text-gray-400">
                            <ImageIcon className="w-10 h-10 mb-2" />
                            <span className="text-sm">No media available</span>
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
                )}

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
            const isTextOnlyPost = isTextPost(post)

            return (
              <div key={post.id} className="relative group">
                {renderAddToCollectionButton(post)}
                {isTextOnlyPost ? (
                  <div className="cursor-pointer" onClick={(e) => handleTextPostClick(post, e)}>
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex space-x-4">
                        <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                          {post.contentType === "text-background" && post.background ? (
                            <div
                              className={`w-full h-full flex items-center justify-center p-2 ${post.background.value} ${post.background.animation || ""}`}
                            >
                              <Type className={`w-6 h-6 ${getTextColorForBackground(post)}`} />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                              <Type className="w-6 h-6 text-gray-400" />
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
                  </div>
                ) : (
                  <Link href={`/post/${post.documentId}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex space-x-4">
                        <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                          {imageUrl ? (
                            <MediaItem
                              src={imageUrl}
                              alt={post.description || "Post media"}
                              type={firstMediaItem?.mime?.startsWith("video/") ? "video" : "image"}
                              objectFit="cover"
                              width={80}
                              height={80}
                              showControls={false}
                              onError={() => {
                                console.error("Media failed to load:", imageUrl)
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
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
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

      {selectedTextPost && (
        <TextPostModal
          isOpen={textPostModalOpen}
          onClose={() => {
            setTextPostModalOpen(false)
            setSelectedTextPost(null)
          }}
          post={{
            id: selectedTextPost.id,
            documentId: selectedTextPost.documentId,
            username: username,
            userImage: user?.profileImage?.url || "/diverse-avatars.png",
            description: selectedTextPost.description,
            contentType: selectedTextPost.contentType,
            background: selectedTextPost.background,
            likesCount: selectedTextPost.likesCount,
            commentsCount: selectedTextPost.commentsCount,
            publishedAt: selectedTextPost.publishedAt,
          }}
        />
      )}
    </div>
  )
}








