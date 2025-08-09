"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ReactionModal } from "./reaction-modal"
import { ReactionService, type ReactionType } from "@/lib/services/reaction-service"
import { useToast } from "@/components/ui/use-toast"

interface ReactionUser {
  id: string | number
  username: string
  displayName?: string
  avatar?: string
}

interface ReactionSummaryProps {
  reactions?: {
    emoji: string
    label: string
    count: number
    users?: ReactionUser[]
  }[]
  totalCount?: number
  className?: string
  compact?: boolean
  postId: string | number // Make postId required
  showViewButton?: boolean
}

export function ReactionSummary({
  reactions: initialReactions,
  totalCount: initialTotalCount,
  className,
  compact = false,
  postId,
  showViewButton = false,
}: ReactionSummaryProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [reactions, setReactions] = useState(initialReactions || [])
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0)
  const [isLoading, setIsLoading] = useState(!initialReactions)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Map reaction types to emojis and labels
  const reactionEmojis: Record<ReactionType, string> = {
    like: "👍",
    love: "❤️",
    haha: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  }

  const reactionLabels: Record<ReactionType, string> = {
    like: "Like",
    love: "Love",
    haha: "Haha",
    wow: "Wow",
    sad: "Sad",
    angry: "Angry",
  }

  // Fetch reaction data from backend
  useEffect(() => {
    if (!postId) return

    const fetchReactionData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const reactionData = await ReactionService.getReactionCounts(postId)

        // Transform the reaction data into the format expected by the component
        const formattedReactions = Object.entries(reactionData)
          .filter(([_, data]) => data.count > 0)
          .map(([type, data]) => {
            // Make sure we have a valid type
            const reactionType = type as ReactionType
            return {
              emoji: reactionEmojis[reactionType] || "👍",
              label: reactionLabels[reactionType] || "Like",
              count: data.count,
              users: data.users || [], // Include user details if available
            }
          })

        const total = Object.values(reactionData).reduce((sum, data) => sum + data.count, 0)

        setReactions(formattedReactions)
        setTotalCount(total)
      } catch (err) {
        setError("Failed to load reactions")
        toast({
          title: "Error",
          description: "Failed to load reaction data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReactionData()
  }, [postId, toast])

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading reactions...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500">Error loading reactions</div>
  }

  if (totalCount === 0) {
    return null
  }

  return (
    <>
      <div className={cn("flex items-center justify-between w-full", className)}>
        <div
          className={cn("flex items-center gap-2 cursor-pointer", compact ? "text-xs" : "text-sm")}
          onClick={() => setModalOpen(true)}
        >
          <div className="flex -space-x-1">
            {reactions.slice(0, 3).map((reaction) => (
              <div
                key={reaction.emoji}
                className={cn(
                  "rounded-full bg-gray-100 flex items-center justify-center shadow-sm border border-white",
                  compact ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm",
                )}
              >
                {reaction.emoji}
              </div>
            ))}
          </div>

          <span className="text-gray-600">
            <span className="font-medium">{totalCount}</span> {totalCount === 1 ? "reaction" : "reactions"}
          </span>
        </div>
      </div>

      <ReactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        reactions={reactions.map((r) => ({ ...r, users: r.users || [] }))}
        totalCount={totalCount}
        postId={postId}
      />
    </>
  )
}
