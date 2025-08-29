"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, MessageCircle, Share2, Bookmark, MoreHorizontal, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { useReactions } from "@/context/reaction-context"
import type { Post } from "@/types/post"
import type { ReactionType } from "@/lib/services/reaction-service"
import EnhancedMediaGallery from "@/components/enhanced-media-gallery"
import FeedCommentSection from "@/components/comments/feed-comment-section"
import RelatedPostsSection from "@/components/post/related-posts-section"
import { formatDate, formatBackendDate } from "@/lib/date-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ReactionDisplay } from "@/components/reaction-display"
import { ReactionButton } from "@/components/reaction-button"

interface PostDetailClientWrapperProps {
  post: Post
  relatedPosts: Post[]
}

export default function PostDetailClientWrapper({ post, relatedPosts }: PostDetailClientWrapperProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const { getReactionCounts } = useReactions()

  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  })
  const [totalReactionCount, setTotalReactionCount] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null)

  // Format the timestamp - check for both createdAt (backend format) and timestamp
  const formattedDate = post.createdAt ? formatBackendDate(post.createdAt) : formatDate(post.timestamp)

  // Load initial reaction counts
  useEffect(() => {
    const loadReactionData = async () => {
      if (!post.id && !post.documentId) return

      try {
        // Get reaction counts
        const counts = await getReactionCounts(post.id)

        // Handle different response formats
        if (counts && counts.reactions) {
          // New structure with users
          setReactionCounts({
            like: counts.reactions.like.count,
            love: counts.reactions.love.count,
            haha: counts.reactions.haha.count,
            wow: counts.reactions.wow.count,
            sad: counts.reactions.sad.count,
            angry: counts.reactions.angry.count,
          })
        } else {
          // Fallback to old structure or empty counts
          setReactionCounts(
            counts || {
              like: 0,
              love: 0,
              haha: 0,
              wow: 0,
              sad: 0,
              angry: 0,
            },
          )
        }

        // Calculate total count
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
        setTotalReactionCount(total)
      } catch (error) {
        console.error("Error loading reaction data:", error)
      }
    }

    loadReactionData()
  }, [post.id, post.documentId, getReactionCounts])

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
          title: post.title || `${post.username}'s post`,
          text: post.description || "Check out this nail art post!",
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
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

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

      {/* Post header */}
      <div className="p-4 sm:p-6 border-b bg-white rounded-t-xl shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href={`/profile/${post.username}`} aria-label={`View ${post.username}'s profile`}>
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 transition-transform hover:scale-105">
                <AvatarImage
                  src={post.userImage || "/abstract-user-icon.png"}
                  alt={post.username || "User"}
                  width={56}
                  height={56}
                  loading="eager"
                />
                <AvatarFallback>{post.username?.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="ml-3">
              <Link
                href={`/profile/${post.username}`}
                className="text-base sm:text-lg font-medium hover:text-pink-600 transition-colors"
              >
                {post.username || "Unknown User"}
              </Link>
              <p className="text-sm text-gray-500">{formattedDate}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main post content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Post media gallery */}
        {post.mediaItems && post.mediaItems.length > 0 && (
          <div className="mb-4">
            <EnhancedMediaGallery mediaItems={post.mediaItems} layout={post.galleryLayout || "grid"} />
          </div>
        )}

        {/* Post content */}
        <div className="p-4 sm:p-6">
          {post.title && <h1 className="text-xl font-semibold mb-2">{post.title}</h1>}

          {post.description && (
            <div className="text-gray-700 mb-4">
              {post.tags && post.tags.length > 0
                ? post.description.split(" ").map((word, i) => {
                    const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, "")
                    const isTag = post.tags?.some((tag) => tag.toLowerCase() === cleanWord)
                    return (
                      <span key={i}>
                        {isTag ? (
                          <Link
                            href={`/explore?tag=${cleanWord}`}
                            className="text-pink-600 hover:underline decoration-1 underline-offset-2 transition-all duration-200"
                          >
                            {word}
                          </Link>
                        ) : (
                          <span className="hover:underline decoration-1 underline-offset-2 cursor-default transition-all duration-200">
                            {word}
                          </span>
                        )}{" "}
                      </span>
                    )
                  })
                : post.description.split(" ").map((word, i) => (
                    <span
                      key={i}
                      className="hover:underline decoration-1 underline-offset-2 cursor-default transition-all duration-200"
                    >
                      {word}{" "}
                    </span>
                  ))}
            </div>
          )}

          {/* Reaction summary */}
          <div className="mt-3 mb-2">
            <div className="bg-gray-50 p-2 rounded-lg">
              <ReactionDisplay postId={post.id} className="px-2 py-1" maxDisplay={5} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              {/* Using the ReactionButton component for consistent behavior with feed page */}
              <ReactionButton
                postId={post.id}
                postDocumentId={post.documentId || post.id.toString()}
                postAuthorId={post.userId || post.authorId || post.user?.id || post.user?.documentId}
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
                {post.comments?.length || 0}
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
      </div>

      {/* Comments section */}
      <div id="comments-section" className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <FeedCommentSection
          postId={post.id}
          documentId={post.documentId}
          allowViewingForAll={true}
          onCommentAdded={() => {
            // Optional callback for when comments are added
          }}
        />
      </div>

      {/* Related posts */}
      {relatedPosts && relatedPosts.length > 0 && <RelatedPostsSection posts={relatedPosts} />}
    </div>
  )
}
