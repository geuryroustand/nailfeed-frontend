"use client"

import { useState, useEffect } from "react"
import { ReactionService, type ReactionType } from "@/lib/services/reaction-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ReactionStatsProps {
  postId: string | number
  className?: string
}

export function ReactionStats({ postId, className }: ReactionStatsProps) {
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReactionStats = async () => {
      try {
        setLoading(true)
        const counts = await ReactionService.getReactionCounts(postId)
        setReactionCounts(counts)

        const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
        setTotalCount(total)
      } catch (error) {
        console.error("Error loading reaction stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReactionStats()
  }, [postId])

  const getReactionEmoji = (type: ReactionType) => {
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

  const getReactionLabel = (type: ReactionType) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getProgressColor = (type: ReactionType) => {
    switch (type) {
      case "like":
        return "bg-blue-500"
      case "love":
        return "bg-red-500"
      case "haha":
        return "bg-yellow-500"
      case "wow":
        return "bg-yellow-500"
      case "sad":
        return "bg-blue-400"
      case "angry":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Reactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (totalCount === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Reactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No reactions yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Reactions ({totalCount})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(reactionCounts)
            .filter(([_, count]) => count > 0)
            .sort(([_, countA], [__, countB]) => countB - countA)
            .map(([type, count]) => (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{getReactionEmoji(type as ReactionType)}</span>
                    <span className="font-medium">{getReactionLabel(type as ReactionType)}</span>
                  </div>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
                <Progress
                  value={(count / totalCount) * 100}
                  className="h-2"
                  indicatorClassName={getProgressColor(type as ReactionType)}
                />
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
