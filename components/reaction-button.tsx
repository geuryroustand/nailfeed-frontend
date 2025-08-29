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
import { addReaction as addReactionServerAction } from "@/app/actions/reaction-actions"

interface ReactionButtonProps {
  postId: string | number
  postDocumentId: string
  onReactionChange?: (type: ReactionType | null) => void
  className?: string
  showCount?: boolean
  initialReactionCounts?: Record<ReactionType, number>
  initialTotalCount?: number
  initialUserReaction?: { id: string; type: ReactionType } | null
  postAuthorId?: string
}

export function ReactionButton({
  postId,
  postDocumentId,
  onReactionChange,
  className,
  showCount = true,
  initialReactionCounts,
  initialTotalCount,
  initialUserReaction,
  postAuthorId,
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
  const { getUserReaction, getReactionCounts } = useReactions()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const reactionsRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hasAttemptedLoad = useRef(false)

  useEffect(() => {
    console.log("[v0] ReactionButton mounted with:", {
      postId,
      postDocumentId,
      hasInitialData: !!(initialReactionCounts && initialTotalCount !== undefined && initialUserReaction !== undefined),
      initialReactionCounts,
      initialTotalCount,
      initialUserReaction,
    })

    if (initialReactionCounts && initialTotalCount !== undefined && initialUserReaction !== undefined) {
      console.log("[v0] Using initial reaction data:", {
        initialReactionCounts,
        initialTotalCount,
        initialUserReaction,
      })
      setReactionCounts(initialReactionCounts)
      setTotalCount(initialTotalCount)

      if (initialUserReaction) {
        setCurrentReaction(initialUserReaction.type)
        setUserReactionId(initialUserReaction.id)
        if (onReactionChange) {
          onReactionChange(initialUserReaction.type)
        }
      } else {
        setCurrentReaction(null)
        setUserReactionId(null)
        if (onReactionChange) {
          onReactionChange(null)
        }
      }

      hasAttemptedLoad.current = true
      return
    } else {
      console.log("[v0] No initial reaction data provided, will fetch from API")
    }
  }, [initialReactionCounts, initialTotalCount, initialUserReaction, onReactionChange])

  const loadReactionData = useCallback(async () => {
    if (hasAttemptedLoad.current || !isAuthenticated || !user) {
      console.log("[v0] loadReactionData early return:", {
        hasAttemptedLoad: hasAttemptedLoad.current,
        isAuthenticated,
        hasUser: !!user,
      })
      return
    }

    console.log("[v0] loadReactionData starting API calls for postId:", postId)

    try {
      const userReaction = await getUserReaction(postId)
      console.log("[v0] getUserReaction result:", userReaction)

      if (userReaction) {
        setCurrentReaction(userReaction.type as ReactionType)
        setUserReactionId(userReaction.id)

        if (onReactionChange) {
          onReactionChange(userReaction.type as ReactionType)
        }
      } else {
        setCurrentReaction(null)
        setUserReactionId(null)

        if (onReactionChange) {
          onReactionChange(null)
        }
      }

      const counts = await getReactionCounts(postId)
      console.log("[v0] getReactionCounts result:", counts)

      if (counts) {
        setReactionCounts({
          like: counts.like?.count || 0,
          love: counts.love?.count || 0,
          haha: counts.haha?.count || 0,
          wow: counts.wow?.count || 0,
          sad: counts.sad?.count || 0,
          angry: counts.angry?.count || 0,
        })

        const total = Object.values(counts).reduce((sum, reactionData: any) => sum + (reactionData?.count || 0), 0)
        setTotalCount(total)
      } else {
        setReactionCounts({
          like: 0,
          love: 0,
          haha: 0,
          wow: 0,
          sad: 0,
          angry: 0,
        })
        setTotalCount(0)
      }
    } catch (error) {
      console.error("ReactionButton: Error loading reaction data:", error)
    }
  }, [postId, getUserReaction, getReactionCounts, isAuthenticated, user, onReactionChange])

  useEffect(() => {
    console.log("[v0] Authenticated user effect:", {
      postId,
      isAuthenticated,
      hasAttemptedLoad: hasAttemptedLoad.current,
    })

    if (postId && isAuthenticated && !hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true
      console.log("[v0] Calling loadReactionData for authenticated user")
      loadReactionData()
    }
  }, [postId, loadReactionData, isAuthenticated])

  useEffect(() => {
    console.log("[v0] Unauthenticated user effect:", {
      postId,
      hasAttemptedLoad: hasAttemptedLoad.current,
    })

    if (postId && !hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true
      console.log("[v0] Loading reaction counts for unauthenticated user")

      const loadCounts = async () => {
        try {
          console.log("[v0] Calling getReactionCounts for unauthenticated user, postId:", postId)
          const counts = await getReactionCounts(postId)
          console.log("[v0] getReactionCounts result for unauthenticated user:", counts)

          if (counts) {
            setReactionCounts({
              like: counts.like?.count || 0,
              love: counts.love?.count || 0,
              haha: counts.haha?.count || 0,
              wow: counts.wow?.count || 0,
              sad: counts.sad?.count || 0,
              angry: counts.angry?.count || 0,
            })

            const total = Object.values(counts).reduce((sum, reactionData: any) => sum + (reactionData?.count || 0), 0)
            setTotalCount(total)
          } else {
            setReactionCounts({
              like: 0,
              love: 0,
              haha: 0,
              wow: 0,
              sad: 0,
              angry: 0,
            })
            setTotalCount(0)
          }
        } catch (error) {
          console.error("Error loading reaction counts for unauthenticated user:", error)
        }
      }

      loadCounts()
    }
  }, [postId, getReactionCounts])

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

    const previousReaction = currentReaction
    const previousCounts = { ...reactionCounts }
    const previousReactionId = userReactionId

    try {
      const isRemovingReaction = currentReaction === type
      const isChangingReaction = currentReaction && currentReaction !== type
      const isAddingNewReaction = !currentReaction

      console.log("[v0] ReactionButton: Starting reaction process:", {
        type,
        currentReaction,
        isRemovingReaction,
        isChangingReaction,
        isAddingNewReaction,
        postId,
        postDocumentId,
        postAuthorId,
        userId: user.id,
        userDocumentId: user.documentId,
      })

      setShowReactions(false)

      console.log("[v0] ReactionButton: About to call server action with params:", {
        postId: String(postId),
        type,
        postDocumentId: String(postDocumentId),
        postAuthorId: String(postAuthorId || ""),
      })

      if (!postAuthorId) {
        console.warn("[v0] ReactionButton: postAuthorId is missing - notifications may not work")
      }

      const result = await addReactionServerAction(
        String(postId),
        type,
        String(postDocumentId),
        String(postAuthorId || ""),
      )

      console.log("[v0] ReactionButton: Server action completed with result:", result)

      if (result.success) {
        if (result.reaction) {
          setCurrentReaction(result.reaction.type as ReactionType)
          setUserReactionId(result.reaction.id)
          if (onReactionChange) {
            onReactionChange(result.reaction.type as ReactionType)
          }
        } else {
          setCurrentReaction(null)
          setUserReactionId(null)
          if (onReactionChange) {
            onReactionChange(null)
          }
        }

        console.log("[v0] ReactionButton: Refreshing reaction counts from server")
        const updatedCounts = await getReactionCounts(postId)
        if (updatedCounts) {
          setReactionCounts({
            like: updatedCounts.like?.count || 0,
            love: updatedCounts.love?.count || 0,
            haha: updatedCounts.haha?.count || 0,
            wow: updatedCounts.wow?.count || 0,
            sad: updatedCounts.sad?.count || 0,
            angry: updatedCounts.angry?.count || 0,
          })

          const total = Object.values(updatedCounts).reduce(
            (sum, reactionData: any) => sum + (reactionData?.count || 0),
            0,
          )
          setTotalCount(total)
        }

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

        window.dispatchEvent(
          new CustomEvent("reactionUpdated", {
            detail: { postId: String(postId) },
          }),
        )
      } else {
        console.error("[v0] ReactionButton: Server action failed:", result.error)
        throw new Error(result.error || "Failed to process reaction")
      }
    } catch (error) {
      console.error("[v0] ReactionButton: Error from server action:", error)

      toast({
        title: "Error",
        description: "Failed to update your reaction. Please try again.",
        variant: "destructive",
      })

      setCurrentReaction(previousReaction)
      setReactionCounts(previousCounts)
      setTotalCount(Object.values(previousCounts).reduce((sum, count) => sum + count, 0))
      setUserReactionId(previousReactionId)

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
