"use client"

import { useState } from "react"
import { MessageCircle, Share2, Bookmark, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ReactionDisplay } from "@/components/reaction-display"
import { ReactionButton } from "@/components/reaction-button"
import type { Post } from "@/lib/post-data"
import type { ReactionType } from "@/lib/services/reaction-service"

interface PostDetailActionsClientProps {
  postData: Post
}

export default function PostDetailActionsClient({ postData }: PostDetailActionsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const [isSaved, setIsSaved] = useState(false)
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null)

  // Handle save button click
  const handleSave = () => {
    if (!isAuthenticated) {
      promptLogin("save posts")
      return
    }

    setIsSaved(!isSaved)
    toast({
      title: isSaved ? "Post unsaved" : "Post saved",
      description: isSaved ? "Post removed from your saved items" : "Post added to your saved items",
    })
  }

  // Handle share button click
  const handleShare = () => {
    // Sharing is allowed for all users since it's a basic web functionality
    if (navigator.share) {
      navigator
        .share({
          title: postData.title || `${postData.username}'s post`,
          text: postData.description || "Check out this nail art post!",
          url: window.location.href,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
        })
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard",
      })
    }
  }

  // Helper function to prompt login
  const promptLogin = (action: string) => {
    toast({
      title: "Authentication required",
      description: (
        <div className="flex flex-col gap-2">
          <p>Please log in or sign up to {action}.</p>
          <Button
            size="sm"
            onClick={() => router.push("/auth")}
            className="bg-pink-500 hover:bg-pink-600 text-white self-start mt-1"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Log in / Sign up
          </Button>
        </div>
      ),
      duration: 5000,
    })
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Authentication banner for non-logged in users */}
      {!isAuthenticated && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <LogIn className="h-5 w-5 text-pink-500 mr-2" />
            <p className="text-sm text-gray-700">Log in to like, comment, and save posts to your collections.</p>
          </div>
          <Button size="sm" onClick={() => router.push("/auth")} className="bg-pink-500 hover:bg-pink-600 text-white">
            Log in / Sign up
          </Button>
        </div>
      )}

      {/* Reaction summary */}
      <div className="mt-3 mb-2">
        <div className="bg-gray-50 p-2 rounded-lg">
          <ReactionDisplay postId={postData.id} className="px-2 py-1" maxDisplay={5} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {/* Using the ReactionButton component for consistent behavior with feed page */}
          <ReactionButton
            postId={postData.id}
            postDocumentId={postData.documentId || postData.id.toString()}
            onReactionChange={(type) => {
              setCurrentReaction(type)
            }}
            className="flex-1"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            {postData.comments?.length || 0}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-5 w-5 mr-1" />
            Share
          </Button>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={`${isSaved ? "text-pink-500" : ""} ${!isAuthenticated ? "opacity-70" : ""}`}
              >
                <Bookmark className={`h-5 w-5 mr-1 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save"}
              </Button>
            </TooltipTrigger>
            {!isAuthenticated && (
              <TooltipContent>
                <p>Log in to save this post</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
