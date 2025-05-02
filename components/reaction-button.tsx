"use client"

import { useState, useEffect, useRef } from "react"
import { Heart, ThumbsUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useReactions } from "@/context/reaction-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { ReactionType } from "@/lib/services/reaction-service"
import { cn } from "@/lib/utils"

interface ReactionButtonProps {
  postId: string | number
  onReactionChange?: (type: ReactionType | null) => void
  className?: string
  showCount?: boolean
}

export function ReactionButton({ postId, onReactionChange, className, showCount = true }: ReactionButtonProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null)
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  })
  const [totalCount, setTotalCount] = useState(0)
  const { getUserReaction, addReaction, getReactionCounts, isLoading } = useReactions()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const reactionsRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Load initial reaction and counts
  useEffect(() => {
    const loadReactionData = async () => {
      try {
        // Get user's current reaction
        const userReaction = await getUserReaction(postId)
        if (userReaction) {
          setCurrentReaction(userReaction.type as ReactionType)
        } else {
          setCurrentReaction(null)
        }

        // Get reaction counts
        const counts = await getReactionCounts(postId)
        setReactionCounts(counts)

        // Calculate total count
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
        setTotalCount(total)
      } catch (error) {
        console.error("Error loading reaction data:", error)
      }
    }

    loadReactionData()
  }, [postId, getUserReaction, getReactionCounts])

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

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to react to posts",
        variant: "destructive",
      })
      return
    }

    try {
      // Toggle reaction if it's the same type
      const newReaction = currentReaction === type ? null : type

      // Optimistically update UI
      setCurrentReaction(newReaction)

      // Update counts optimistically
      const newCounts = { ...reactionCounts }
      if (currentReaction) {
        newCounts[currentReaction] = Math.max(0, newCounts[currentReaction] - 1)
      }
      if (newReaction) {
        newCounts[newReaction] = newCounts[newReaction] + 1
      }
      setReactionCounts(newCounts)
      setTotalCount(Object.values(newCounts).reduce((sum, count) => sum + count, 0))

      // Call the API
      await addReaction(postId, type)

      // Notify parent component
      if (onReactionChange) {
        onReactionChange(newReaction)
      }

      // Hide the reactions panel
      setShowReactions(false)

      // Refresh counts after API call
      const updatedCounts = await getReactionCounts(postId)
      setReactionCounts(updatedCounts)
      setTotalCount(Object.values(updatedCounts).reduce((sum, count) => sum + count, 0))
    } catch (error) {
      console.error("Error adding reaction:", error)
      toast({
        title: "Error",
        description: "Failed to add your reaction. Please try again.",
        variant: "destructive",
      })

      // Revert optimistic updates
      const userReaction = await getUserReaction(postId)
      if (userReaction) {
        setCurrentReaction(userReaction.type as ReactionType)
      } else {
        setCurrentReaction(null)
      }

      const counts = await getReactionCounts(postId)
      setReactionCounts(counts)
      setTotalCount(Object.values(counts).reduce((sum, count) => sum + count, 0))
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
      <button
        ref={buttonRef}
        className={cn(
          `flex items-center justify-center w-full py-2 rounded-md hover:bg-gray-100 transition-colors`,
          getReactionColor(),
          className,
        )}
        onClick={() => (currentReaction ? handleReaction(currentReaction) : setShowReactions(true))}
        onMouseEnter={() => setShowReactions(true)}
        disabled={isLoading}
      >
        {getReactionIcon()}
        <span className="text-sm font-medium">{getReactionText()}</span>
        {showCount && totalCount > 0 && <span className="ml-1 text-xs text-gray-500">({totalCount})</span>}
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
            className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg p-1 flex z-10"
            onMouseLeave={() => setShowReactions(false)}
          >
            {[
              { type: "like" as ReactionType, emoji: "👍" },
              { type: "love" as ReactionType, emoji: "❤️" },
              { type: "haha" as ReactionType, emoji: "😂" },
              { type: "wow" as ReactionType, emoji: "😮" },
              { type: "sad" as ReactionType, emoji: "😢" },
              { type: "angry" as ReactionType, emoji: "😡" },
            ].map((reaction) => (
              <motion.button
                key={reaction.type}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-1 mx-1 rounded-full hover:bg-gray-100 transition-colors",
                  currentReaction === reaction.type && "bg-gray-100",
                )}
                onClick={() => handleReaction(reaction.type)}
              >
                <span className="text-2xl" role="img" aria-label={reaction.type}>
                  {reaction.emoji}
                </span>
                {reactionCounts[reaction.type] > 0 && (
                  <span className="absolute -bottom-1 -right-1 bg-gray-100 rounded-full text-xs px-1">
                    {reactionCounts[reaction.type]}
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
