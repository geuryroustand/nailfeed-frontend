"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Flag, Trash, Edit, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePostOwnership } from "@/hooks/use-post-ownership"
import { TryOnButton } from "@/components/try-on/try-on-button"
import { ShareButton } from "@/components/share-button"
import { useAuth } from "@/hooks/use-auth"
import { extractPostImageUrl } from "@/lib/image-url-extractor"

interface PostDetailActionsProps {
  postId: string
  authorId: string
  imageUrl?: string
  designTitle?: string
  onEdit?: () => void
  onDelete?: () => void
  onReport?: () => void
  // Add additional props to handle different image URL sources
  post?: {
    imageUrl?: string
    media?: Array<{ url: string }>
    image?: string
    images?: string[]
  }
}

export function PostDetailActions({
  postId,
  authorId,
  imageUrl,
  designTitle = "Nail Design",
  onEdit,
  onDelete,
  onReport,
  post,
}: PostDetailActionsProps) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const { isOwner } = usePostOwnership(authorId)
  const { isAuthenticated } = useAuth()

  const handleLike = () => {
    setLiked(!liked)
  }

  const handleSave = () => {
    setSaved(!saved)
  }

  const handleDownload = () => {
    const finalImageUrl = getValidImageUrl()
    if (finalImageUrl && !finalImageUrl.includes("placeholder.svg")) {
      const link = document.createElement("a")
      link.href = finalImageUrl
      link.download = `nail-design-${postId}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Function to extract valid image URL from various possible sources
  const getValidImageUrl = (): string => {
    console.log("PostDetailActions - Input props:", {
      imageUrl,
      post,
      postId,
      authorId,
    })

    // First try the direct imageUrl prop
    if (imageUrl && imageUrl.trim() && !imageUrl.includes("undefined") && !imageUrl.includes("null")) {
      console.log("PostDetailActions - Using direct imageUrl prop:", imageUrl)
      return imageUrl
    }

    // Then try extracting from post object
    if (post) {
      const extractedUrl = extractPostImageUrl(post)
      console.log("PostDetailActions - Extracted URL from post:", extractedUrl)
      return extractedUrl
    }

    // Fallback
    console.warn("PostDetailActions - No valid image source found, using fallback")
    return "/placeholder.svg?height=400&width=400&text=No+Image+Available"
  }

  const finalImageUrl = getValidImageUrl()

  return (
    <div className="flex items-center justify-between py-2">
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

        <ShareButton url={`/post/${postId}`} title={designTitle} />
      </div>

      <div className="flex items-center space-x-2">
        <TryOnButton designImageUrl={finalImageUrl} designTitle={designTitle} variant="outline" size="sm" />

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
            {finalImageUrl && !finalImageUrl.includes("placeholder.svg") && (
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}

            {isOwner && (
              <>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}

                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-500">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
              </>
            )}

            {!isOwner && onReport && (
              <DropdownMenuItem onClick={onReport}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Add default export
export default PostDetailActions
