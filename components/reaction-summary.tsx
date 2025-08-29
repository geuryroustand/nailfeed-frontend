"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ReactionModal } from "./reaction-modal"
import { ReactionService, type ReactionType } from "@/lib/services/reaction-service"
import { useToast } from "@/components/ui/use-toast"
import { POLLING_CONFIG } from "@/lib/config"

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
  likes?: Array<{
    id: number
    documentId: string
    type: string
    user?: {
      id: number
      documentId: string
      username: string
      displayName?: string
    }
  }>
}

export function ReactionSummary({
  reactions: initialReactions,
  totalCount: initialTotalCount,
  className,
  compact = false,
  postId,
  showViewButton = false,
  likes,
}: ReactionSummaryProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [reactions, setReactions] = useState(initialReactions || [])
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0)
  const [isLoading, setIsLoading] = useState(!initialReactions && !likes)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isPolling, setIsPolling] = useState(false)
  const { toast } = useToast()

  console.log("[v0] ReactionSummary render:", {
    postId,
    totalCount,
    reactions: reactions.length,
    isLoading,
    error,
    hasLikesData: !!likes,
    likesCount: likes?.length || 0,
    refreshTrigger,
    isPolling,
  })

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

  const processLikesData = (likesData: typeof likes) => {
    if (!likesData || likesData.length === 0) {
      setReactions([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    console.log("[v0] ReactionSummary processing likes data:", likesData)

    // Group likes by type and count them
    const reactionCounts: Record<string, { count: number; users: ReactionUser[] }> = {}

    likesData.forEach((like) => {
      const type = like.type as ReactionType
      if (!reactionCounts[type]) {
        reactionCounts[type] = { count: 0, users: [] }
      }
      reactionCounts[type].count++

      if (like.user) {
        reactionCounts[type].users.push({
          id: like.user.id,
          username: like.user.username,
          displayName: like.user.displayName || like.user.username,
          avatar: null, // Avatar not provided in likes data
        })
      }
    })

    // Transform into component format
    const formattedReactions = Object.entries(reactionCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => {
        const reactionType = type as ReactionType
        return {
          emoji: reactionEmojis[reactionType] || "👍",
          label: reactionLabels[reactionType] || "Like",
          count: data.count,
          users: data.users,
        }
      })

    const total = Object.values(reactionCounts).reduce((sum, data) => sum + data.count, 0)

    console.log("[v0] ReactionSummary processed likes data:", {
      formattedReactions,
      total,
    })

    setReactions(formattedReactions)
    setTotalCount(total)
    setIsLoading(false)
  }

  const refreshReactions = async () => {
    if (!postId) return

    try {
      setIsLoading(true)
      setError(null)

      console.log("[v0] ReactionSummary manually refreshing data for postId:", postId)

      const reactionData = await ReactionService.getReactionCounts(String(postId))

      console.log("[v0] ReactionSummary manually refreshed data:", reactionData)

      // Transform the reaction data into the format expected by the component
      const formattedReactions = Object.entries(reactionData)
        .filter(([_, data]) => data.count > 0)
        .map(([type, data]) => {
          const reactionType = type as ReactionType
          return {
            emoji: reactionEmojis[reactionType] || "👍",
            label: reactionLabels[reactionType] || "Like",
            count: data.count,
            users: data.users || [],
          }
        })

      const total = Object.values(reactionData).reduce((sum, data) => sum + data.count, 0)

      console.log("[v0] ReactionSummary manually processed data:", {
        formattedReactions,
        total,
      })

      setReactions(formattedReactions)
      setTotalCount(total)
    } catch (err) {
      console.error("[v0] ReactionSummary manual refresh error:", err)
      setError("Failed to load reactions")
      setReactions([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!postId || !POLLING_CONFIG.ENABLE_POLLING) return

    // Start polling when component mounts
    setIsPolling(true)

    const pollInterval = setInterval(async () => {
      try {
        const reactionData = await ReactionService.getReactionCounts(String(postId))

        // Transform the reaction data
        const formattedReactions = Object.entries(reactionData)
          .filter(([_, data]) => data.count > 0)
          .map(([type, data]) => {
            const reactionType = type as ReactionType
            return {
              emoji: reactionEmojis[reactionType] || "👍",
              label: reactionLabels[reactionType] || "Like",
              count: data.count,
              users: data.users || [],
            }
          })

        const total = Object.values(reactionData).reduce((sum, data) => sum + data.count, 0)

        // Only update if data has changed to avoid unnecessary re-renders
        const currentTotal = reactions.reduce((sum, r) => sum + r.count, 0)
        if (total !== currentTotal) {
          console.log("[v0] ReactionSummary polling detected changes:", { oldTotal: currentTotal, newTotal: total })
          setReactions(formattedReactions)
          setTotalCount(total)
        }
      } catch (error) {
        console.error("[v0] ReactionSummary polling error:", error)
        // Don't show errors for polling failures to avoid spam
      }
    }, POLLING_CONFIG.REACTION_POLLING_INTERVAL)

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }
  }, [postId, reactions])

  useEffect(() => {
    const handleReactionUpdate = (event: CustomEvent) => {
      const { postId: updatedPostId } = event.detail || {}
      if (updatedPostId === postId || updatedPostId === String(postId)) {
        console.log("[v0] ReactionSummary received reaction update event for postId:", postId)
        refreshReactions()
      }
    }

    window.addEventListener("reactionUpdated", handleReactionUpdate as EventListener)

    return () => {
      window.removeEventListener("reactionUpdated", handleReactionUpdate as EventListener)
    }
  }, [postId])

  useEffect(() => {
    if (!postId) return

    if (likes !== undefined && likes.length > 0) {
      processLikesData(likes)
      return
    }

    if (likes === undefined || likes.length === 0 || refreshTrigger > 0) {
      const fetchReactionData = async () => {
        try {
          setIsLoading(true)
          setError(null)

          console.log("[v0] ReactionSummary fetching data for postId:", postId, "refreshTrigger:", refreshTrigger)

          const reactionData = await ReactionService.getReactionCounts(String(postId))

          console.log("[v0] ReactionSummary received data:", reactionData)

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

          console.log("[v0] ReactionSummary processed data:", {
            formattedReactions,
            total,
          })

          setReactions(formattedReactions)
          setTotalCount(total)
        } catch (err) {
          console.error("[v0] ReactionSummary error:", err)
          setError("Failed to load reactions")
          setReactions([])
          setTotalCount(0)
          // Don't show toast for API errors to avoid spam
        } finally {
          setIsLoading(false)
        }
      }

      fetchReactionData()
    } else {
      setReactions([])
      setTotalCount(0)
      setIsLoading(false)
    }
  }, [postId, likes, refreshTrigger])

  if (isLoading) {
    console.log("[v0] ReactionSummary showing loading state")
    return <div className="text-sm text-gray-500">Loading reactions...</div>
  }

  if (error) {
    console.log("[v0] ReactionSummary had error but showing no reactions:", error)
    // Fall through to show "No reactions yet" instead of error
  }

  console.log("[v0] ReactionSummary final render:", {
    totalCount,
    reactionsCount: reactions.length,
    willShowReactions: totalCount > 0,
  })

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 rounded-lg p-3 transition-colors",
          totalCount > 0 ? "bg-gray-50" : "bg-transparent",
          className,
        )}
        onClick={() => totalCount > 0 && setModalOpen(true)}
      >
        <div className={cn("flex items-center gap-2", compact ? "text-xs" : "text-sm")}>
          {totalCount > 0 && (
            <>
              <div className="flex -space-x-1">
                {reactions.slice(0, 3).map((reaction) => (
                  <div
                    key={reaction.emoji}
                    className={cn(
                      "rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200",
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
            </>
          )}

          {totalCount === 0 && <span className="text-gray-500 text-sm">No reactions yet</span>}
        </div>

        {totalCount > 0 && <span className="text-xs text-gray-400">Click to view</span>}
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
