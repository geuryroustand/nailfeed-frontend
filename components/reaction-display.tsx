"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle } from "lucide-react"
import { useReactions } from "@/context/reaction-context"

interface ReactionDisplayProps {
  postId: number | string
  showTotal?: boolean
  maxDisplay?: number
  onReactionClick?: () => void
  className?: string
}

export function ReactionDisplay({
  postId,
  showTotal = true,
  maxDisplay = 3,
  onReactionClick,
  className = "",
}: ReactionDisplayProps) {
  const { getReactionCounts } = useReactions()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Array<{ emoji: string; label: string; count: number }>>([])
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const fetchReactions = async () => {
      if (!postId) return

      setIsLoading(true)
      setError(null)

      try {
        // Get reaction counts from context
        const counts = await getReactionCounts(postId)

        // Process the reaction data
        let reactionData: Array<{ emoji: string; label: string; count: number }> = []
        let total = 0

        // Handle different response formats
        if (counts && counts.reactions) {
          // New structure with users
          reactionData = Object.entries(counts.reactions)
            .map(([type, data]) => ({
              emoji: getEmojiForType(type),
              label: type,
              count: data.count,
            }))
            .filter((reaction) => reaction.count > 0)
            .sort((a, b) => b.count - a.count)

          total = reactionData.reduce((sum, reaction) => sum + reaction.count, 0)
        } else if (counts) {
          // Old structure
          reactionData = Object.entries(counts)
            .map(([type, count]) => ({
              emoji: getEmojiForType(type),
              label: type,
              count: count as number,
            }))
            .filter((reaction) => reaction.count > 0)
            .sort((a, b) => b.count - a.count)

          total = reactionData.reduce((sum, reaction) => sum + reaction.count, 0)
        }

        setReactions(reactionData)
        setTotalCount(total)
      } catch (err) {
        console.error("Error fetching reactions:", err)
        setError("Failed to load reactions")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReactions()
  }, [postId, getReactionCounts])

  // Helper function to get emoji for reaction type
  const getEmojiForType = (type: string): string => {
    switch (type.toLowerCase()) {
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

  if (isLoading) {
    return <ReactionSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center text-sm text-red-500">
        <AlertCircle className="h-4 w-4 mr-1" />
        <span>{error}</span>
      </div>
    )
  }

  // If no reactions, return null or an empty state
  if (totalCount === 0) {
    return null
  }

  // Limit displayed reactions to maxDisplay
  const displayedReactions = reactions.slice(0, maxDisplay)
  const hasMoreReactions = reactions.length > maxDisplay

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      onClick={onReactionClick}
      role="button"
      tabIndex={0}
      aria-label={`${totalCount} reactions on this post`}
    >
      <div className="flex -space-x-1">
        {displayedReactions.map((reaction, index) => (
          <TooltipProvider key={reaction.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block text-lg" style={{ zIndex: displayedReactions.length - index }}>
                  {reaction.emoji}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {reaction.count} {reaction.label}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {hasMoreReactions && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 rounded-full text-xs font-medium">
                  +{reactions.length - maxDisplay}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {reactions
                    .slice(maxDisplay)
                    .map((r) => `${r.emoji} ${r.count}`)
                    .join(", ")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {showTotal && (
        <span className="text-sm text-gray-500 ml-1">
          {totalCount} {totalCount === 1 ? "reaction" : "reactions"}
        </span>
      )}
    </div>
  )
}

function ReactionSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
      <Skeleton className="w-20 h-4" />
    </div>
  )
}
