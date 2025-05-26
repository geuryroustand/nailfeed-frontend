"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Flag, Trash, Edit, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TryOnButton } from "@/components/try-on/try-on-button"
import { usePostOwnership } from "@/hooks/use-post-ownership"
import { formatDistanceToNow } from "date-fns"
import { ShareButton } from "@/components/share-button"

interface Post {
  id: string
  title: string
  description?: string
  imageUrl?: string
  image?: string
  media?: Array<{ url: string }>
  images?: string[]
  author: {
    id: string
    name: string
    username: string
    avatarUrl?: string
  }
  createdAt: string
  likes: number
  comments: number
}

interface PostDetailModalProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
}

export function PostDetailModal({ post, isOpen, onClose, onEdit, onDelete }: PostDetailModalProps) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const { isOwner } = usePostOwnership(post?.author.id || "")

  if (!post) return null

  // Function to extract valid image URL from various possible sources
  const getValidImageUrl = (): string => {
    console.log("PostDetailModal - Extracting image URL from post:", {
      postImageUrl: post.imageUrl,
      postImage: post.image,
      postMedia: post.media,
      postImages: post.images,
    })

    // Try different sources in order of preference
    const possibleUrls = [post.imageUrl, post.image, post.media?.[0]?.url, post.images?.[0]].filter(Boolean) // Remove falsy values

    console.log("PostDetailModal - Possible URLs found:", possibleUrls)

    // Return the first valid URL or fallback
    const validUrl = possibleUrls[0] || "/placeholder.svg?height=400&width=400&text=Nail+Design"
    console.log("PostDetailModal - Selected image URL:", validUrl)

    return validUrl
  }

  const handleLike = () => {
    setLiked(!liked)
  }

  const handleSave = () => {
    setSaved(!saved)
  }

  const handleEdit = () => {
    if (onEdit) onEdit(post.id)
    onClose()
  }

  const handleDelete = () => {
    if (onDelete) onDelete(post.id)
    onClose()
  }

  const handleDownload = () => {
    const imageUrl = getValidImageUrl()
    if (imageUrl && !imageUrl.includes("placeholder.svg")) {
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = `nail-design-${post.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const validImageUrl = getValidImageUrl()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Image */}
          <div className="bg-black flex items-center justify-center">
            <img
              src={validImageUrl || "/placeholder.svg"}
              alt={post.title}
              className="w-full h-full object-contain max-h-[80vh]"
              onError={(e) => {
                console.error("PostDetailModal - Image failed to load:", validImageUrl)
                e.currentTarget.src = "/placeholder.svg?height=400&width=400&text=Image+Not+Found"
              }}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col h-full max-h-[80vh]">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={post.author.avatarUrl || "/placeholder.svg"} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-base font-medium">{post.author.name}</DialogTitle>
                  <p className="text-sm text-gray-500">@{post.author.username}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-bold text-lg mb-2">{post.title}</h3>
              {post.description && <p className="text-gray-700 mb-4">{post.description}</p>}
              <p className="text-sm text-gray-500 mb-4">{timeAgo}</p>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-pink-500 text-pink-500" : "text-gray-500"}`} />
                  <span className="text-sm">{liked ? post.likes + 1 : post.likes}</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm">{post.comments}</span>
                </div>
              </div>
            </div>

            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLike}
                    aria-label={liked ? "Unlike" : "Like"}
                    className={liked ? "text-pink-500" : ""}
                  >
                    <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                  </Button>

                  <Button variant="ghost" size="icon" aria-label="Comment">
                    <MessageCircle className="h-5 w-5" />
                  </Button>

                  <ShareButton url={`/post/${post.id}`} title={post.title} />
                </div>

                <div className="flex items-center space-x-2">
                  <TryOnButton designImageUrl={validImageUrl} designTitle={post.title} variant="outline" size="sm" />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    aria-label={saved ? "Unsave" : "Save"}
                    className={saved ? "text-yellow-500" : ""}
                  >
                    <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="More options">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {validImageUrl && !validImageUrl.includes("placeholder.svg") && (
                        <DropdownMenuItem onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}

                      {isOwner && (
                        <>
                          <DropdownMenuItem onClick={handleEdit}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                        </>
                      )}

                      {!isOwner && (
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add default export
export default PostDetailModal
