"use client"

import { useState, useEffect } from "react"
import { ReactionService, type ReactionType } from "@/lib/services/reaction-service"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ReactionDetailsProps {
  postId: string | number
  className?: string
}

interface ReactionUser {
  id: string
  username: string
  displayName?: string
  profileImage?: string
}

interface ReactionWithUser {
  id: string
  type: ReactionType
  user: ReactionUser
}

export function ReactionDetails({ postId, className }: ReactionDetailsProps) {
  const [reactions, setReactions] = useState<ReactionWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("all")

  useEffect(() => {
    const loadReactions = async () => {
      try {
        setLoading(true)

        // In a real implementation, you would fetch actual reaction data with user info
        // This is a mock implementation
        const response = await ReactionService.getPostReactions(postId)

        // Create mock reaction data with users
        const mockReactions: ReactionWithUser[] = []
        const reactionTypes: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"]

        for (let i = 0; i < 20; i++) {
          const randomType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)]
          mockReactions.push({
            id: `reaction-${i}`,
            type: randomType,
            user: {
              id: `user-${i}`,
              username: `user${i}`,
              displayName: `User ${i}`,
              profileImage: `/placeholder.svg?height=40&width=40&query=user`,
            },
          })
        }

        setReactions(mockReactions)
      } catch (error) {
        console.error("Error loading reactions:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReactions()
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

  const filteredReactions =
    activeTab === "all" ? reactions : reactions.filter((reaction) => reaction.type === activeTab)

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reactions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-gray-500 text-center py-4">No reactions yet</p>
        </CardContent>
      </Card>
    )
  }

  // Count reactions by type
  const reactionCounts = reactions.reduce(
    (counts, reaction) => {
      counts[reaction.type] = (counts[reaction.type] || 0) + 1
      return counts
    },
    {} as Record<string, number>,
  )

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">
              All ({reactions.length})
            </TabsTrigger>
            {Object.entries(reactionCounts)
              .sort(([_, countA], [__, countB]) => countB - countA)
              .map(([type, count]) => (
                <TabsTrigger key={type} value={type} className="flex-1">
                  <span className="mr-1">{getReactionEmoji(type as ReactionType)}</span>
                  <span>({count})</span>
                </TabsTrigger>
              ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filteredReactions.map((reaction) => (
                <div key={reaction.id} className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={reaction.user.profileImage || "/placeholder.svg"} alt={reaction.user.username} />
                    <AvatarFallback>{reaction.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{reaction.user.displayName || reaction.user.username}</p>
                    <p className="text-xs text-gray-500">@{reaction.user.username}</p>
                  </div>
                  <span className="text-xl">{getReactionEmoji(reaction.type)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
