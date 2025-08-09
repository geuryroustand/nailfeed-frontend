"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Heart, ThumbsUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useReactions } from "@/context/reaction-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { ReactionType } from "@/lib/services/reaction-service"
import { cn } from "@/lib/utils"
import { ReactionSummary } from "./reaction-summary"

interface ReactionButtonProps {
  postId: string | number
  postDocumentId: string
  onReactionChange?: (type: ReactionType | null) => void
  className?: string
  showCount?: boolean
}

export function ReactionButton({
  postId,
  postDocumentId,
  onReactionChange,
  className,
  showCount = true,
}: ReactionButtonProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null)
  const [userReactionId, setUserReactionId] = useState<string | null>(null)
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [isProcessingReaction, setIsProcessingReaction] = useState(false)
  const { getUserReaction, addReaction, getReactionCounts } = useReactions()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const reactionsRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hasAttemptedLoad = useRef(false)

  // Memoize the loadReactionData function to prevent unnecessary re-renders
  const loadReactionData = useCallback(async () => {
    // Skip if we're not authenticated or user is not available
    if (!isAuthenticated || !user) {
      return
    }

    try {
      // Get user's current reaction
      const userReaction = await getUserReaction(postId)

      if (userReaction) {
        setCurrentReaction(userReaction.type as ReactionType)
        setUserReactionId(userReaction.id)

        // Notify parent component if callback provided
        if (onReactionChange) {
          onReactionChange(userReaction.type as ReactionType)
        }
      } else {
        setCurrentReaction(null)
        setUserReactionId(null)

        // Notify parent component if callback provided
        if (onReactionChange) {
          onReactionChange(null)
        }
      }

      // Get reaction counts
      const counts = await getReactionCounts(postId)

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
      setTotalCount(total)
    } catch (error) {
      console.error("ReactionButton: Error loading reaction data:", error)
    }
  }, [postId, getUserReaction, getReactionCounts, isAuthenticated, user, onReactionChange])

  // Load initial reaction and counts
  useEffect(() => {
    if (postId && isAuthenticated && !hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true
      loadReactionData()
    }
  }, [postId, loadReactionData, isAuthenticated])

  // Load reaction counts even for unauthenticated users
  useEffect(() => {
    if (postId && !hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true

      // Only get counts for unauthenticated users
      const loadCounts = async () => {
        try {
          const counts = await getReactionCounts(postId)

          if (counts && counts.reactions) {
            setReactionCounts({
              like: counts.reactions.like.count,
              love: counts.reactions.love.count,
              haha: counts.reactions.haha.count,
              wow: counts.reactions.wow.count,
              sad: counts.reactions.sad.count,
              angry: counts.reactions.angry.count,
            })
          } else {
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

          const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
          setTotalCount(total)
        } catch (error) {
          // Silently fail for unauthenticated users
          console.error("Error loading reaction counts for unauthenticated user:", error)
        }
      }

      loadCounts()
    }
  }, [postId, getReactionCounts])

  // Handle clicking outside the reactions panel
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

  // Handle mouse movement for better UX with the reaction selector
  useEffect(() => {
    // Handle mouse leave events for the reaction button
    const handleMouseMove = (event: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(event.target as Node) && showReactions) {
        // Check if mouse has moved far enough away from the reaction button
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

    // Prevent multiple simultaneous reaction requests
    if (isProcessingReaction) {
      return
    }

    setIsProcessingReaction(true)

    try {
      // Store previous state for rollback if needed
      const previousReaction = currentReaction
      const previousCounts = { ...reactionCounts }
      const previousReactionId = userReactionId

      // Determine if we're removing a reaction (clicking the same reaction again)
      const isRemovingReaction = currentReaction === type
      const newReaction = isRemovingReaction ? null : type

      // Update local state immediately for responsive UI
      setCurrentReaction(newReaction)

      // Update counts optimistically
      const newCounts = { ...reactionCounts }

      // If user had a previous reaction, decrease that count
      if (currentReaction) {
        newCounts[currentReaction] = Math.max(0, newCounts[currentReaction] - 1)
      }

      // If adding a new reaction, increase that count
      if (newReaction) {
        newCounts[newReaction] = newCounts[newReaction] + 1
      }

      setReactionCounts(newCounts)
      setTotalCount(Object.values(newCounts).reduce((sum, count) => sum + count, 0))

      // Hide the reactions panel immediately for better UX
      setShowReactions(false)

      // Notify parent component immediately
      if (onReactionChange) {
        onReactionChange(newReaction)
      }

      // Call the API in the background
      addReaction(postId, type, postDocumentId, user.id, user.documentId)
        .then((result) => {
          // Update the reaction ID if we got a new one
          if (result && result.id) {
            setUserReactionId(result.id)
          } else if (isRemovingReaction) {
            setUserReactionId(null)
          }

          // Show success toast based on the action performed
          if (isRemovingReaction) {
            toast({
              title: "Reaction removed",
              description: "Your reaction has been removed",
            })
          } else if (previousReaction) {
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

          // Refresh counts after API call to ensure accuracy
          return getReactionCounts(postId)
        })
        .then((updatedCounts) => {
          if (updatedCounts && updatedCounts.reactions) {
            // New structure with users
            setReactionCounts({
              like: updatedCounts.reactions.like.count,
              love: updatedCounts.reactions.love.count,
              haha: updatedCounts.reactions.haha.count,
              wow: updatedCounts.reactions.wow.count,
              sad: updatedCounts.reactions.sad.count,
              angry: updatedCounts.reactions.angry.count,
            })
          } else {
            // Fallback to old structure or empty counts
            setReactionCounts(
              updatedCounts || {
                like: 0,
                love: 0,
                haha: 0,
                wow: 0,
                sad: 0,
                angry: 0,
              },
            )
          }

          setTotalCount(Object.values(updatedCounts).reduce((sum, count) => sum + count, 0))
        })
        .catch((error) => {
          console.error("ReactionButton: Error from API call:", error)

          // Show error toast
          toast({
            title: "Error",
            description: "Failed to update your reaction. Reverting to previous state.",
            variant: "destructive",
          })

          // Revert to previous state
          setCurrentReaction(previousReaction)
          setReactionCounts(previousCounts)
          setTotalCount(Object.values(previousCounts).reduce((sum, count) => sum + count, 0))
          setUserReactionId(previousReactionId)

          // Notify parent component of the reversion
          if (onReactionChange) {
            onReactionChange(previousReaction)
          }
        })
        .finally(() => {
          setIsProcessingReaction(false)
        })
    } catch (error) {
      console.error("ReactionButton: Error in reaction handler:", error)
      setIsProcessingReaction(false)

      toast({
        title: "Error",
        description: "Failed to process your reaction",
        variant: "destructive",
      })
    }
  }

  const getReactionIcon = () => {
    switch (currentReaction) {
      case "like":
        return <ThumbsUp className="h-5 w-5 mr-2" />
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
        return <Heart className="h-5 w-5 mr-2" />
    }
  }

  const getReactionColor = () => {
    switch (currentReaction) {
      case "like":
        return "text-blue-500"
      case "love":
        return "text-red-500"
      case "haha":
      case "wow":
        return "text-yellow-500"
      case "sad":
        return "text-blue-400"
      case "angry":
        return "text-orange-500"
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
            {showCount && totalCount > 0 && (
              <ReactionSummary
                reactions={Object.entries(reactionCounts)
                  .filter(([_, count]) => count > 0)
                  .map(([type, count]) => ({
                    emoji:
                      type === "like"
                        ? "👍"
                        : type === "love"
                          ? "❤️"
                          : type === "haha"
                            ? "😂"
                            : type === "wow"
                              ? "😮"
                              : type === "sad"
                                ? "😢"
                                : type === "angry"
                                  ? "😡"
                                  : "👍",
                    label: type,
                    count,
                  }))}
                totalCount={totalCount}
                compact={true}
                className="ml-1"
              />
            )}
          </>
        )}
      </motion.button>

      {/* Reactions panel */}
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
