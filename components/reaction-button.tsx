"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Heart, ThumbsUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useReactions } from "@/context/reaction-context"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import type { ReactionType } from "@/lib/services/reaction-service"
import { cn } from "@/lib/utils"

interface ReactionButtonProps {
  postId: string | number
  postDocumentId: string
  onReactionChange?: (type: ReactionType | null) => void
  className?: string
  showCount?: boolean
  // New props using backend data directly
  reactions: { type: ReactionType; emoji: string; count: number }[]
  likesCount: number // Total count from backend (all reaction types)
  userReaction?: ReactionType | null
  postAuthorId?: string
}

export function ReactionButton({
  postId,
  postDocumentId,
  onReactionChange,
  className,
  showCount = true,
  reactions,
  likesCount,
  userReaction,
  postAuthorId,
}: ReactionButtonProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(userReaction || null)
  const [isProcessingReaction, setIsProcessingReaction] = useState(false)
  const { addReaction } = useReactions()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const reactionsRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Use backend's likesCount directly (backend already calculates total of all reaction types)
  const totalReactions = likesCount

  // Update current reaction when userReaction prop changes
  useEffect(() => {
    setCurrentReaction(userReaction || null)
    if (onReactionChange) {
      onReactionChange(userReaction || null)
    }
  }, [userReaction, onReactionChange])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
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

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(event.target as Node) && showReactions) {
        const rect = reactionsRef.current.getBoundingClientRect()
        const isOutsideHorizontal = event.clientX < rect.left - 50 || event.clientX > rect.right + 50
        const isOutsideVertical = event.clientY < rect.top - 50 || event.clientY > rect.bottom + 50

        if (isOutsideHorizontal || isOutsideVertical) {
          setShowReactions(false)
        }
      }
    }

    if (showReactions) {
      document.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [showReactions])

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to react to posts",
        variant: "destructive",
      })
      return
    }

    if (isProcessingReaction) {
      return
    }

    setIsProcessingReaction(true)

    try {
      const previousReaction = currentReaction
      const isRemovingReaction = currentReaction === type
      const isChangingReaction = currentReaction && currentReaction !== type

      // Update UI optimistically
      const newReaction = isRemovingReaction ? null : type
      setCurrentReaction(newReaction)
      setShowReactions(false)

      if (onReactionChange) {
        onReactionChange(newReaction)
      }

      const result = await addReaction(postId, type, postDocumentId, user.id, user.documentId, postAuthorId)

      // Show appropriate toast message
      if (isRemovingReaction) {
        toast({
          title: "Reaction removed",
          description: "Your reaction has been removed",
        })
      } else if (isChangingReaction) {
        toast({
          title: "Reaction changed",
          description: `Changed your reaction to ${type}`,
        })
      } else {
        toast({
          title: "Reaction added",
          description: `You reacted with ${type} to this post`,
        })
      }

      // Dispatch event to trigger refresh from backend (parent component should refetch)
      window.dispatchEvent(
        new CustomEvent("reactionUpdated", {
          detail: { postId: String(postId) },
        }),
      )

    } catch (error) {
      console.error("ReactionButton: Error from API call:", error)

      toast({
        title: "Error",
        description: "Failed to update your reaction",
        variant: "destructive",
      })

      // Revert to previous state on error
      setCurrentReaction(previousReaction)
      if (onReactionChange) {
        onReactionChange(previousReaction)
      }
    } finally {
      setIsProcessingReaction(false)
    }
  }

  const getReactionIcon = () => {
    switch (currentReaction) {
      case "like":
        return <ThumbsUp className="h-5 w-5 mr-2 fill-current" />
      case "love":
        return <span className="mr-2 text-lg">❤️</span>
      case "haha":
        return <span className="mr-2 text-lg">😂</span>
      case "wow":
        return <span className="mr-2 text-lg">😮</span>
      case "sad":
        return <span className="mr-2 text-lg">😢</span>
      case "angry":
        return <span className="mr-2 text-lg">😡</span>
      default:
        return <ThumbsUp className="h-5 w-5 mr-2" />
    }
  }

  const getReactionColor = () => {
    switch (currentReaction) {
      case "like":
        return "text-blue-500 font-semibold"
      case "love":
        return "text-red-500 font-semibold"
      case "haha":
      case "wow":
        return "text-yellow-500 font-semibold"
      case "sad":
        return "text-blue-400 font-semibold"
      case "angry":
        return "text-orange-500 font-semibold"
      default:
        return "text-gray-500"
    }
  }

  const getReactionText = () => {
    switch (currentReaction) {
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

  return (
    <div className="relative flex-1">
      <motion.button
        ref={buttonRef}
        whileHover={{ backgroundColor: "rgba(243, 244, 246, 0.8)" }}
        className={cn(
          `flex items-center justify-center w-full py-2 rounded-md transition-colors`,
          getReactionColor(),
          isProcessingReaction ? "opacity-70" : "",
          className,
        )}
        onClick={() => (currentReaction ? handleReaction(currentReaction) : setShowReactions(true))}
        onMouseEnter={() => isAuthenticated && !isProcessingReaction && setShowReactions(true)}
        disabled={isProcessingReaction}
        aria-label={currentReaction ? `Remove ${getReactionText()} reaction` : "Add reaction"}
      >
        {isProcessingReaction ? (
          <div className="flex items-center">
            <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-500 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">Processing...</span>
          </div>
        ) : (
          <>
            {getReactionIcon()}
            <span className="text-sm font-medium">{getReactionText()}</span>
            {showCount && totalReactions > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {totalReactions} {totalReactions === 1 ? "reaction" : "reactions"}
              </span>
            )}
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {showReactions && isAuthenticated && !isProcessingReaction && (
          <motion.div
            ref={reactionsRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg p-2 z-10"
            onMouseLeave={() => setShowReactions(false)}
          >
            <div className="flex items-center justify-center px-2">
              {[
                { type: "like" as ReactionType, emoji: "👍", label: "Like" },
                { type: "love" as ReactionType, emoji: "❤️", label: "Love" },
                { type: "haha" as ReactionType, emoji: "😂", label: "Haha" },
                { type: "wow" as ReactionType, emoji: "😮", label: "Wow" },
                { type: "sad" as ReactionType, emoji: "😢", label: "Sad" },
                { type: "angry" as ReactionType, emoji: "😡", label: "Angry" },
              ].map((reaction) => (
                <motion.button
                  key={reaction.type}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "p-1.5 mx-1 rounded-full hover:bg-gray-100 transition-colors relative",
                    currentReaction === reaction.type && "bg-gray-100 scale-110",
                  )}
                  onClick={() => handleReaction(reaction.type)}
                  aria-label={
                    currentReaction === reaction.type
                      ? `Remove ${reaction.label} reaction`
                      : currentReaction
                        ? `Change reaction to ${reaction.label}`
                        : `React with ${reaction.label}`
                  }
                >
                  <span className="text-2xl" role="img" aria-label={reaction.label}>
                    {reaction.emoji}
                  </span>
                  {currentReaction === reaction.type && (
                    <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-3 h-3 border-2 border-white"></span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
