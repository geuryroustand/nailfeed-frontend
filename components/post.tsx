"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, MoreHorizontal, Smile, Trash2, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { BackgroundType } from "./post-background-selector"
import type { MediaItem, MediaGalleryLayout } from "@/types/media"
import { ShareMenu } from "./share-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import { DirectImageTest } from "./direct-image-test"
import { SafePostImage } from "./safe-post-image"
import MediaGallery from "./media-gallery"
import { ReactionSummary } from "./reaction-summary"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import FeedCommentSection from "@/components/comments/feed-comment-section"

// Import the hook
import { usePostDeletion } from "@/hooks/use-post-deletion"

// Import CommentsService
import { CommentsService } from "@/lib/services/comments-service"

// Import the date utility function
import { formatDate, formatBackendDate } from "@/lib/date-utils"

// Import the ReactionButton component
import { ReactionButton } from "./reaction-button"

// Add the import for TryOnButton and TryOnModal at the top of the file
import { TryOnButton } from "@/components/try-on/try-on-button"
import { TryOnModal } from "@/components/try-on/try-on-modal"

// Hardcoded API base URL for testing
const API_BASE_URL = "https://nailfeed-backend-production.up.railway.app"

interface PostProps {
  post: {
    id: number
    documentId?: string
    username: string
    userImage: string
    image?: string
    video?: string
    mediaItems?: MediaItem[]
    galleryLayout?: MediaGalleryLayout
    description: string
    title?: string // Add this line
    likes: number
    comments: any[]
    timestamp: string
    createdAt?: string
    contentType?: "image" | "video" | "text-background" | "media-gallery"
    background?: BackgroundType
    reactions?: {
      emoji: string
      label: string
      count: number
      users?: {
        id: string | number
        username: string
        displayName?: string
        avatar?: string
      }[]
    }[]
    userId?: string
    authorId?: string
    user?: {
      id: string
      documentId?: string
      username?: string
    }
    userDocumentId?: string
    comments_count?: number
  }
  viewMode?: "cards" | "compact"
  onPostDeleted?: (postId: number) => void
  onPostUpdated?: (updatedPost: any) => void
}

type Reaction = "like" | "love" | "haha" | "wow" | "sad" | "angry" | null

// Define reaction data for reuse
const reactionData = [
  { type: "like", emoji: "👍", label: "Like", color: "text-blue-500" },
  { type: "love", emoji: "❤️", label: "Love", color: "text-red-500" },
  { type: "haha", emoji: "😂", label: "Haha", color: "text-yellow-500" },
  { type: "wow", emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { type: "sad", emoji: "😢", label: "Sad", color: "text-blue-400" },
  { type: "angry", emoji: "😡", label: "Angry", color: "text-orange-500" },
]

export default function Post({ post, viewMode = "cards", onPostDeleted, onPostUpdated }: PostProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [reaction, setReaction] = useState<Reaction>(null)
  const [showReactions, setShowReactions] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(() => {
    // First try to use comments_count if available
    if (post.comments_count !== undefined && post.comments_count > 0) {
      return post.comments_count
    }
    // Then try to use comments array length if available
    if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
      return post.comments.length
    }
    // Default to 0 if no comment data is available
    return 0
  })
  const reactionsRef = useRef<HTMLDivElement>(null)
  const likeButtonRef = useRef<HTMLButtonElement>(null)
  const { toast } = useToast()
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === "development")
  const [imageError, setImageError] = useState(false)
  const { user, isAuthenticated } = useAuth() || { user: null, isAuthenticated: false }
  const [showComments, setShowComments] = useState(false)

  // Inside the Post component, add a new state for the try-on modal
  const [tryOnModalOpen, setTryOnModalOpen] = useState(false)

  // Post deletion hook
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    deleteError,
    handleDeletePost: deletePostHandler,
  } = usePostDeletion({
    onPostDeleted,
  })

  // Generate mock reactions if not provided
  const [postReactions] = useState(() => {
    if (post.reactions && post.reactions.length > 0) {
      return post.reactions
    }

    // Generate mock reactions
    const mockReactions = [
      {
        emoji: "👍",
        label: "like",
        count: Math.floor(Math.random() * 10) + 1,
        users: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
          id: `like-user-${i}`,
          username: `user${i + 1}`,
          displayName: `User ${i + 1}`,
          avatar: `/placeholder.svg?height=40&width=40&query=user+${i + 1}`,
        })),
      },
      {
        emoji: "❤️",
        label: "love",
        count: Math.floor(Math.random() * 8) + 1,
        users: Array.from({ length: Math.floor(Math.random() * 8) + 1 }, (_, i) => ({
          id: `love-user-${i}`,
          username: `loveuser${i + 1}`,
          displayName: `Love User ${i + 1}`,
          avatar: `/placeholder.svg?height=40&width=40&query=user+${i + 10}`,
        })),
      },
      {
        emoji: "😂",
        label: "haha",
        count: Math.floor(Math.random() * 6) + 1,
        users: Array.from({ length: Math.floor(Math.random() * 6) + 1 }, (_, i) => ({
          id: `haha-user-${i}`,
          username: `hahauser${i + 1}`,
          displayName: `Haha User ${i + 1}`,
          avatar: `/placeholder.svg?height=40&width=40&query=user+${i + 20}`,
        })),
      },
    ]

    return mockReactions
  })

  // Calculate total reaction count
  const totalReactionCount = postReactions.reduce((total, reaction) => total + reaction.count, 0)

  // Add a function to properly handle image URLs from different data structures
  const getImageUrl = () => {
    // If there are no media items, fall back to post.image or default
    if (!post || ((!post.mediaItems || post.mediaItems.length === 0) && !post.image)) {
      return "/intricate-nail-art.png"
    }

    // If post has direct image property, use it
    if (post.image) {
      return post.image
    }

    // If we have mediaItems, try to extract the URL from the first one
    if (post.mediaItems && post.mediaItems.length > 0) {
      const mediaItem = post.mediaItems[0]

      // If the mediaItem has a direct URL property, use it
      if (mediaItem.url) {
        return mediaItem.url
      }

      // If the mediaItem has file with formats, extract the URL
      if (mediaItem.file && mediaItem.file.formats) {
        const formats = mediaItem.file.formats
        const formatUrl = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || formats.large?.url

        if (formatUrl) {
          const fullUrl = `${API_BASE_URL}${formatUrl}`
          return fullUrl
        }
      }

      // If the mediaItem has a direct file URL
      if (mediaItem.file && mediaItem.file.url) {
        const fullUrl = `${API_BASE_URL}${mediaItem.file.url}`
        return fullUrl
      }

      // If the mediaItem has attributes with URL
      if (mediaItem.attributes && mediaItem.attributes.url) {
        const fullUrl = `${API_BASE_URL}${mediaItem.attributes.url}`
        return fullUrl
      }

      // If the mediaItem has attributes with formats
      if (mediaItem.attributes && mediaItem.attributes.formats) {
        const formats = mediaItem.attributes.formats
        const formatUrl = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || formats.large?.url

        if (formatUrl) {
          const fullUrl = `${API_BASE_URL}${formatUrl}`
          return fullUrl
        }
      }

      // For newly created posts, we might need to construct a URL based on the mediaItem ID
      if (mediaItem.id) {
        // This is a fallback approach - the actual URL structure depends on your backend
        const fallbackUrl = `${API_BASE_URL}/uploads/media-items/${mediaItem.id}.jpg`
        return fallbackUrl
      }
    }

    // If all else fails, return a placeholder
    return "/intricate-nail-art.png"
  }

  // Format post description to highlight hashtags
  const formatDescriptionWithHashtags = () => {
    if (!post.description) return null

    const parts = post.description.split(/(#\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <Link
            href={`/explore?tag=${part.substring(1)}`}
            key={index}
            className="text-pink-500 font-medium hover:underline"
            onClick={(e) => e.stopPropagation()} // Prevent triggering parent link
          >
            {part}
          </Link>
        )
      }
      return part
    })
  }

  // Get the profile URL for the post author
  const getProfileUrl = () => {
    // Use username for profile links
    return `/profile/${post.username}`
  }

  const handleLikeClick = async () => {
    // If no reaction is set, show the reaction picker
    // If a reaction is set, toggle it off
    if (!reaction) {
      setShowReactions(true)
    } else {
      // Call handleReaction with the current reaction to toggle it off
      await handleReaction(reaction)
    }
  }

  const handleReaction = async (reactionType: Reaction) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user?.id) {
        toast({
          title: "Authentication required",
          description: "Please sign in to react to posts",
          variant: "destructive",
        })
        return
      }

      // Check if we have the necessary document IDs
      if (!user.documentId || !post.documentId) {
        toast({
          title: "Error",
          description: "Could not process reaction due to missing data",
          variant: "destructive",
        })
        return
      }

      // Determine if we're adding or removing a reaction
      const isRemovingReaction = reaction === reactionType
      const newReaction = isRemovingReaction ? null : reactionType

      // Update local state optimistically
      setReaction(newReaction)

      // Update like count optimistically
      if (isRemovingReaction) {
        setLikeCount(Math.max(0, likeCount - 1))
      } else if (!reaction) {
        setLikeCount(likeCount + 1)
      } else {
        // Switching from one reaction to another - count stays the same
      }

      // Get the API URL from environment variables
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

      // Get token from localStorage or cookie
      let token = null
      if (typeof window !== "undefined") {
        token = localStorage.getItem("jwt")
        if (!token) {
          const cookies = document.cookie.split(";")
          const jwtCookie = cookies.find((cookie) => cookie.trim().startsWith("jwt="))
          if (jwtCookie) {
            token = jwtCookie.split("=")[1].trim()
          }
        }
      }

      // First, check if the user already has a reaction for this post
      const checkResponse = await fetch(
        `${API_URL}/api/likes?filters[post][id][$eq]=${post.id}&filters[user][id][$eq]=${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        },
      )

      if (!checkResponse.ok) {
        throw new Error(`API error checking existing reactions: ${checkResponse.status} ${checkResponse.statusText}`)
      }

      const checkData = await checkResponse.json()

      let response

      // If user already has a reaction
      if (checkData.data && checkData.data.length > 0) {
        const existingReaction = checkData.data[0]
        const existingReactionId = existingReaction.id

        if (isRemovingReaction) {
          // User is removing their reaction

          response = await fetch(`${API_URL}/api/likes/${existingReactionId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          })
        } else if (existingReaction.attributes.type !== reactionType) {
          // User is changing their reaction type

          const updateData = {
            data: {
              type: reactionType,
            },
          }

          response = await fetch(`${API_URL}/api/likes/${existingReactionId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(updateData),
            credentials: "include",
          })
        } else {
          // User clicked the same reaction again (should be handled by isRemovingReaction)
          return
        }
      } else if (!isRemovingReaction) {
        // User is adding a new reaction

        // Prepare the request data
        const likeData = {
          data: {
            type: reactionType,
            user: {
              connect: [user.documentId],
            },
            post: {
              connect: [post.documentId],
            },
          },
        }

        response = await fetch(`${API_URL}/api/likes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(likeData),
          credentials: "include",
        })
      } else {
        // User tried to remove a reaction they don't have
        return
      }

      if (response) {
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        if (response.status !== 204) {
          // 204 is No Content (for DELETE)
          await response.json()
        }
      }

      // Show success toast
      toast({
        title: isRemovingReaction ? "Reaction removed" : "Reaction added",
        description: isRemovingReaction
          ? "Your reaction has been removed"
          : `You reacted with ${reactionType} to this post`,
      })
    } catch (error) {
      // Error processing reaction

      // Revert optimistic updates on error
      setReaction(reaction)

      // Revert like count on error
      if (reaction === null && reactionType !== null) {
        // We were adding a reaction
        setLikeCount(Math.max(0, likeCount - 1))
      } else if (reaction !== null && reactionType === reaction) {
        // We were removing a reaction
        setLikeCount(likeCount + 1)
      }

      toast({
        title: "Error",
        description: "Failed to save your reaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getReactionEmoji = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "👍"
      case "love":
        return "❤️"
      case "haha":
        return "😂"
      case "wow":
        return "😮"
      case "sad":
        return "😢"
      case "angry":
        return "😡"
      default:
        return null
    }
  }

  const getReactionColor = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "text-blue-500"
      case "love":
        return "text-red-500"
      case "haha":
        return "text-yellow-500"
      case "wow":
        return "text-yellow-500"
      case "sad":
        return "text-yellow-500"
      case "angry":
        return "text-orange-500"
      default:
        return "text-gray-500"
    }
  }

  const getReactionText = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "Like"
      case "love":
        return "Love"
      case "haha":
        return "Haha"
      case "wow":
        return "Wow"
      case "sad":
        return "Sad"
      case "angry":
        return "Angry"
      default:
        return "Like"
    }
  }

  const getTextColorForBackground = () => {
    if (!post.background) return "text-black"

    if (post.background.type === "color" || post.background.type === "gradient") {
      return "text-white"
    }

    return "text-black"
  }

  // Generate the post URL - prefer documentId if available
  const getPostUrl = () => {
    // Use documentId if available, otherwise fall back to id
    const postIdentifier = post.documentId || post.id
    return `/post/${postIdentifier}`
  }

  // Handle share success
  const handleShareSuccess = () => {
    toast({
      title: "Post shared!",
      description: "Thanks for sharing this post.",
      duration: 2000,
    })
  }

  // Check if the current user is the post owner
  const isPostOwner = () => {
    if (!isAuthenticated || !user) return false

    // Check various possible ID fields to determine ownership
    return (
      // Check numeric IDs
      (post.userId && user.id && post.userId.toString() === user.id.toString()) ||
      (post.authorId && user.id && post.authorId.toString() === user.id.toString()) ||
      (post.user?.id && user.id && post.user.id.toString() === user.id.toString()) ||
      // Check document IDs (Strapi v5 specific)
      (post.userDocumentId && user.documentId && post.userDocumentId === user.documentId) ||
      (post.user?.documentId && user.documentId && post.user.documentId === user.documentId) ||
      // Check usernames
      (post.username && user.username && post.username === user.username) ||
      (post.user?.username && user.username && post.user.username === user.username)
    )
  }

  // Handle post deletion
  const handleDeletePost = () => {
    deletePostHandler(post)
  }

  // Handle comment added
  const handleCommentAdded = () => {
    setCommentCount((prev) => prev + 1)
    // If we have a comments_count property on the post, update it too
    if (post.comments_count !== undefined) {
      post.comments_count += 1
    }
    // If onPostUpdated is provided, call it with the updated post
    if (onPostUpdated) {
      onPostUpdated({
        ...post,
        comments_count: post.comments_count !== undefined ? post.comments_count : commentCount + 1,
      })
    }
  }

  // Handle comment deleted
  const handleCommentDeleted = () => {
    setCommentCount((prev) => Math.max(0, prev - 1))
    // If we have a comments_count property on the post, update it too
    if (post.comments_count !== undefined && post.comments_count > 0) {
      post.comments_count -= 1
    }
    // If onPostUpdated is provided, call it with the updated post
    if (onPostUpdated) {
      onPostUpdated({
        ...post,
        comments_count: post.comments_count !== undefined ? post.comments_count : Math.max(0, commentCount - 1),
      })
    }
  }

  // Log the image URL for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Test image loading in development mode
      const img = new Image()
      img.onload = () => {}
      img.onerror = (e) => {}
      img.src = getImageUrl()
    }
  }, [post])

  // Handle clicking outside the reactions panel for the like button
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(event.target as Node) &&
        likeButtonRef.current &&
        !likeButtonRef.current.contains(event.target as Node)
      ) {
        setShowReactions(false)
      }
    }

    if (showReactions) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showReactions])

  // Set up network request monitoring for comment fetching
  useEffect(() => {
    // Create a performance observer to monitor network requests
    if (typeof window !== "undefined" && window.PerformanceObserver) {
      // This will help us capture the actual URL being used
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Filter for comment-related requests
          if ((entry.initiatorType === "fetch" && entry.name.includes("comment")) || entry.name.includes("comments")) {
            console.log("🔍 Comment API Request URL:", entry.name)
          }
        }
      })

      // Start observing network requests
      observer.observe({ entryTypes: ["resource"] })

      return () => {
        // Clean up the observer when component unmounts
        observer.disconnect()
      }
    }
  }, [post.id, post.documentId])

  // Fetch comment count when component mounts
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        // Skip fetching if we don't have a valid post ID
        if (!post || (!post.id && !post.documentId)) {
          console.log("Skipping comment count fetch - no valid post ID")
          return
        }

        // Use the documentId if available, otherwise use numeric ID
        const identifier = post.documentId || post.id

        console.log(`Fetching comments for post ID: ${post.id}, document ID: ${identifier.toString()}`)

        try {
          // Get the actual comments from the service
          const commentsResponse = await CommentsService.getComments(post.id, identifier.toString())

          // Log the actual response to see what we're getting back
          console.log("Comments API response:", commentsResponse)

          if (commentsResponse && commentsResponse.data) {
            // Calculate total comments including all nested replies
            const totalCount = CommentsService.countTotalComments(commentsResponse.data)
            console.log(`Counted ${totalCount} total comments (including replies) for post ${post.id}`)

            // Only update if we actually have comments (avoid setting to 0 if API fails but returns empty data)
            if (totalCount > 0 || (commentsResponse.data && commentsResponse.data.length === 0)) {
              setCommentCount(totalCount)
            } else if (post.comments_count !== undefined && post.comments_count > 0) {
              // Fallback to post.comments_count if API returns no comments but we know there should be some
              setCommentCount(post.comments_count)
            } else if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
              // Last resort: use the comments array length
              setCommentCount(post.comments.length)
            }
          } else if (post.comments_count !== undefined && post.comments_count > 0) {
            // Fallback to post.comments_count if API response is invalid
            setCommentCount(post.comments_count)
          }
        } catch (error) {
          console.error("Error fetching comment count:", error)
          // If we have comments_count from the post object, use that as fallback
          if (post.comments_count !== undefined && post.comments_count > 0) {
            setCommentCount(post.comments_count)
          } else if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
            // Last resort: use the comments array length
            setCommentCount(post.comments.length)
          }
        }
      } catch (error) {
        console.error("Error in fetchCommentCount:", error)
        // Use any available fallback data
        if (post.comments_count !== undefined && post.comments_count > 0) {
          setCommentCount(post.comments_count)
        } else if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
          setCommentCount(post.comments.length)
        }
      }
    }

    // Only fetch if we don't already have an accurate count
    // Check if post.comments_count is defined and use it directly if available
    if (post.comments_count !== undefined) {
      setCommentCount(post.comments_count)
    } else {
      fetchCommentCount()
    }
  }, [post.id, post.documentId, post.comments_count])

  // Debug log for comment count
  useEffect(() => {
    console.log(`Current comment count for post ${post.id}: ${commentCount}`, {
      postCommentsCount: post.comments_count,
      postCommentsLength: post.comments?.length,
      stateCommentCount: commentCount,
    })
  }, [commentCount, post.id, post.comments_count, post.comments?.length])

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
      {/* Add direct image test in development mode */}
      {showDebug && (
        <div className="p-2 bg-gray-50 border-b">
          <DirectImageTest />
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Image URL Debug:</h3>
            <p className="text-xs break-all mb-2">{getImageUrl()}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-1">Next.js Image:</p>
                <div className="aspect-video relative rounded overflow-hidden bg-gray-100">
                  <Image
                    src={getImageUrl() || "/placeholder.svg"}
                    alt="Post image"
                    fill
                    className="object-contain" // Changed from "object-cover" to "object-contain"
                    onError={() => setImageError(true)}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs mb-1">Regular img tag:</p>
                <div className="aspect-video relative rounded overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl() || "/placeholder.svg"}
                    alt="Post image"
                    className="w-full h-full object-contain" // Changed from "object-cover" to "object-contain"
                    onError={() => setImageError(true)}
                  />
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowDebug(false)}>
            Hide Debug
          </Button>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Link href={getProfileUrl()} className="flex items-center group">
            <EnhancedAvatar
              src={post.userImage}
              alt={post.username}
              className="h-10 w-10"
              fallbackClassName="bg-pink-100 text-pink-800"
            />
            <div className="ml-3">
              {/* Post author username and timestamp */}
              <div className="flex items-center">
                <p className="text-sm font-medium group-hover:text-pink-500 transition-colors">{post.username}</p>
                {isPostOwner() && (
                  <span className="ml-2 text-xs bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded-full">You</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {post.createdAt ? formatBackendDate(post.createdAt) : formatDate(post.timestamp)}
              </p>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save post</DropdownMenuItem>
              <DropdownMenuItem>Hide post</DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
              {isPostOwner() && (
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500 focus:bg-red-50 flex items-center"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              )}
              {process.env.NODE_ENV === "development" && (
                <DropdownMenuItem onClick={() => setShowDebug(!showDebug)}>
                  {showDebug ? "Hide Debug" : "Show Debug"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post title - only display if it exists */}
        {post.title && (
          <div className="mb-2">
            <h2 className="text-lg font-bold text-gray-900">{post.title}</h2>
          </div>
        )}

        {/* Post description - NOT wrapped in a Link to avoid nesting issues */}
        <div className="mb-3">
          <p className="text-sm">{formatDescriptionWithHashtags()}</p>
        </div>

        {/* Separate clickable area for the post detail */}
        {!post.contentType && !post.image && (!post.mediaItems || post.mediaItems.length === 0) && (
          <Link
            href={getPostUrl()}
            className="block w-full h-10 text-center text-gray-500 text-sm hover:bg-gray-50 rounded-md mb-3"
          >
            View post details
          </Link>
        )}

        {post.contentType === "text-background" && post.background ? (
          <div className={`rounded-lg p-6 mb-3 ${post.background.value} ${post.background.animation || ""}`}>
            <p className={`text-xl font-semibold text-center ${getTextColorForBackground()}`}>
              {formatDescriptionWithHashtags()}
            </p>
            <Link
              href={getPostUrl()}
              className="block w-full text-center text-white/70 text-xs mt-4 hover:text-white/90"
            >
              View details
            </Link>
          </div>
        ) : null}

        {/* Post media content */}
        {post.mediaItems && post.mediaItems.length > 0 && (
          <div className="mb-3 w-full">
            <Link href={getPostUrl()} className="block w-full">
              <MediaGallery
                items={post.mediaItems}
                layout={post.galleryLayout || "grid"}
                maxHeight={400}
                objectFit="contain" // Added objectFit="contain" prop
              />
            </Link>
          </div>
        )}
        {/* Fallback for posts with only image property and no mediaItems */}
        {!post.mediaItems && post.image && (
          <div className="mb-3 w-full">
            <Link href={getPostUrl()} className="block w-full">
              <SafePostImage
                src={getImageUrl()}
                alt={post.description || "Post image"}
                className="w-full rounded-md overflow-hidden"
                fallbackSrc="/intricate-nail-art.png"
                objectFit="contain" // Added objectFit="contain" prop
              />
            </Link>
          </div>
        )}

        {/* Enhanced Dedicated Reactions Section */}
        <div className="mt-3 mb-2">
          {totalReactionCount > 0 ? (
            <div
              className="bg-gray-50 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setModalOpen(true)}
            >
              <ReactionSummary reactions={postReactions} totalCount={totalReactionCount} postId={post.id} />
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <button
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
                onClick={() => setShowReactions(true)}
              >
                <Smile className="h-4 w-4" />
                <span>Add reaction</span>
              </button>

              {/* Reactions panel */}
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    ref={reactionsRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 bg-white rounded-full shadow-lg p-1 flex"
                    onMouseLeave={() => setShowReactions(false)}
                  >
                    {[
                      { type: "like" as Reaction, emoji: "👍" },
                      { type: "love" as Reaction, emoji: "❤️" },
                      { type: "haha" as Reaction, emoji: "😂" },
                      { type: "wow" as Reaction, emoji: "😮" },
                      { type: "sad" as Reaction, emoji: "😢" },
                      { type: "angry" as Reaction, emoji: "😡" },
                    ].map((r) => (
                      <motion.button
                        key={r.type}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "p-1.5 mx-1 rounded-full hover:bg-gray-100 transition-colors",
                          reaction === r.type && "bg-gray-100",
                        )}
                        onClick={() => {
                          handleReaction(r.type as Reaction)
                          setShowReactions(false)
                        }}
                      >
                        <span className="text-lg" role="img" aria-label={r.label} title={r.label}>
                          {r.emoji}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Likes and comments count */}
        <div className="flex items-center justify-between mt-3 pb-3 border-b">
          <div className="flex items-center">
            {reaction && <span className="mr-1 text-sm">{getReactionEmoji(reaction)}</span>}
            <span className="text-sm text-gray-500">{likeCount > 0 ? `${likeCount}` : ""}</span>
          </div>
          <div className="text-sm text-gray-500">{commentCount > 0 && `${commentCount} comments`}</div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between py-1 relative">
          <ReactionButton
            postId={post.id}
            postDocumentId={post.documentId || post.id.toString()}
            onReactionChange={(type) => {
              // Update local state if needed
              setReaction(type)
              // Update like count based on reaction change
              if (type && !reaction) {
                setLikeCount(likeCount + 1)
              } else if (!type && reaction) {
                setLikeCount(Math.max(0, likeCount - 1))
              }
            }}
            showCount={true}
            className="flex-1"
          />

          <button
            className="flex items-center justify-center flex-1 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            onClick={() => setCommentOpen(!commentOpen)}
            aria-label={`View ${commentCount} comments`}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium hidden md:inline-block">
              Comments ({commentCount > 0 ? commentCount : "0"})
            </span>
            <span className="text-sm font-medium md:hidden">Comments ({commentCount > 0 ? commentCount : "0"})</span>
          </button>

          <ShareMenu
            url={getPostUrl()}
            title={post.description}
            description={`Check out this post by ${post.username}`}
            image={getImageUrl()}
            variant="ghost"
            className="flex-1 justify-center py-2 h-auto rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            onShare={handleShareSuccess}
          />

          {/* Add the Try On button */}
          <TryOnButton
            onClick={() => setTryOnModalOpen(true)}
            className="flex-1 justify-center py-2 h-auto rounded-md hover:bg-gray-100 transition-colors text-gray-500"
          />
        </div>

        {commentOpen && (
          <FeedCommentSection
            postId={post.id}
            documentId={post.documentId || post.id.toString()}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
            allowViewingForAll={true} // Add this prop to indicate all users can view comments
          />
        )}
      </div>

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
                <AlertCircle className="h-4 w-4 mr-1" />
                {deleteError}
              </div>
            )}
          </div>
        }
        onConfirm={handleDeletePost}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
        disabled={isDeleting}
      />

      {/* Try On Modal */}
      <TryOnModal
        open={tryOnModalOpen}
        onOpenChange={setTryOnModalOpen}
        designImageUrl={getImageUrl()}
        designTitle={post.title || `${post.username}'s design`}
      />
    </div>
  )
}
