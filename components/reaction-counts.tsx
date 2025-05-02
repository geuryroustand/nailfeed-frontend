"use client"

import { useState, useEffect } from "react"
import { getPostReactionCounts } from "@/lib/post-actions"
import { motion } from "framer-motion"

interface ReactionCountsProps {
  postId: number
  className?: string
}

export function ReactionCounts({ postId, className = "" }: ReactionCountsProps) {
  const [counts, setCounts] = useState<Record<string, number>>({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReactionCounts = async () => {
      try {
        setLoading(true)
        const reactionCounts = await getPostReactionCounts(postId)
        setCounts(reactionCounts)
        setError(null)
      } catch (err) {
        setError("Failed to load reaction counts")
        console.error("Error fetching reaction counts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReactionCounts()
  }, [postId])

  // Get total reactions
  const totalReactions = Object.values(counts).reduce((sum, count) => sum + count, 0)

  // Skip rendering if no reactions
  if (!loading && totalReactions === 0) {
    return null
  }

  // Get emoji for each reaction type
  const getEmoji = (type: string) => {
    switch (type) {
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
        return "👍"
    }
  }

  // Sort reaction types by count (highest first)
  const sortedReactions = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className={`flex items-center ${className}`}>
      {loading ? (
        <div className="flex items-center space-x-1">
          <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-10 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ) : error ? (
        <div className="text-xs text-red-500">{error}</div>
      ) : (
        <>
          {/* Emoji stack */}
          <div className="flex -space-x-1 mr-1.5">
            {sortedReactions.slice(0, 3).map(([type, _]) => (
              <motion.div
                key={type}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-5 h-5 flex items-center justify-center bg-white rounded-full shadow-sm"
              >
                <span role="img" aria-label={type}>
                  {getEmoji(type)}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Total count */}
          <span className="text-xs text-gray-600">{totalReactions}</span>
        </>
      )}
    </div>
  )
}
