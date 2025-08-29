"use client"

import { useState, useCallback } from "react"
import { MoreHorizontal, MessageCircle, Bookmark, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ReactionSummary } from "@/components/reaction-summary"
import { ReactionButton } from "@/components/reaction-button"
import { ShareMenu } from "@/components/share-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import type { Post } from "@/lib/post-data"

interface PostClientActionsProps {
  post: Post
}

export default function PostClientActions({ post }: PostClientActionsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  // Generate the post URL
  const postUrl = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
    return `${baseUrl}/post/${post.documentId || post.id}`
  }, [post.documentId, post.id])

  // Handle bookmark action
  const handleBookmark = useCallback(async () => {
    try {
      setIsBookmarked((prev) => !prev)

      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        description: isBookmarked
          ? "This post has been removed from your bookmarks"
          : "This post has been added to your bookmarks",
        duration: 2000,
      })
    } catch (error) {
      // Revert optimistic update on error
      setIsBookmarked((prev) => !prev)

      toast({
        title: "Error",
        description: "Failed to update bookmark status. Please try again.",
        variant: "destructive",
      })
    }
  }, [isBookmarked, toast])

  // Handle share success
  const handleShareSuccess = useCallback(() => {
    toast({
      title: "Post shared!",
      description: "Thanks for sharing this post.",
      duration: 2000,
    })
  }, [toast])

  // Handle scroll to comments
  const scrollToComments = useCallback(() => {
    document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
      {/* Post actions dropdown */}
      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleBookmark}>
              {isBookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
            </DropdownMenuItem>
            <DropdownMenuItem>Report post</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reactions summary */}
      <div className="mb-4">
        <ReactionSummary postId={post.id} totalCount={post.likes || 0} showViewButton={true} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between py-4 border-t border-b">
        {/* Replace the like button with ReactionButton */}
        {post.documentId ? (
          <ReactionButton
            postId={post.id}
            postDocumentId={post.documentId}
            className="flex-1"
            showCount={false}
            postAuthorId={post.userId?.toString() || post.user?.id?.toString() || post.user?.documentId}
          />
        ) : (
          <Button
            variant="ghost"
            className="flex-1 flex items-center justify-center gap-2 text-gray-500"
            disabled={!isAuthenticated}
          >
            <span>Like</span>
            {!isAuthenticated && <span className="text-xs">(Sign in to react)</span>}
          </Button>
        )}

        <Button variant="ghost" className="flex-1 flex items-center justify-center gap-2" onClick={scrollToComments}>
          <MessageCircle className="h-5 w-5" />
          <span>Comment</span>
          {post.comments?.length > 0 && <span className="text-sm">({post.comments.length})</span>}
        </Button>

        <ShareMenu
          url={postUrl()}
          title={post.description || "Check out this post"}
          description={`Check out this post by ${post.username}`}
          image={post.image || (post.mediaItems && post.mediaItems[0]?.url)}
          variant="ghost"
          className="flex-1 flex items-center justify-center gap-2"
          onShare={handleShareSuccess}
          buttonContent={
            <>
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </>
          }
        />

        <Button
          variant="ghost"
          className={cn("flex-1 flex items-center justify-center gap-2", isBookmarked && "text-pink-500")}
          onClick={handleBookmark}
        >
          <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
          <span>{isBookmarked ? "Saved" : "Save"}</span>
        </Button>
      </div>
    </div>
  )
}
