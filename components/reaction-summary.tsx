"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ReactionModal } from "./reaction-modal"
import {
  ReactionService,
  type ReactionType,
  REACTION_TYPES,
} from "@/lib/services/reaction-service"

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

type ReactionCountEntry = {
  count: number
  users: Array<{
    id: string | number
    username: string
    displayName?: string
    profileImage?: any
  }>
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

  // Simplified - data comes from backend directly

  // Use data directly from backend - no complex calculations needed
  const reactions = initialReactions || []
  // Use backend's totalCount directly (backend already calculates correct total)
  const totalCount = initialTotalCount || 0

  // No loading needed - data comes from backend directly

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
        totalCount={totalCount}
        postId={postId}
      />
    </>
  )
}
