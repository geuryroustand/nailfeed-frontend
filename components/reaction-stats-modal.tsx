"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { useReactions } from "@/context/reaction-context"

interface ReactionStatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: number | string
}

export function ReactionStatsModal({ open, onOpenChange, postId }: ReactionStatsModalProps) {
  const { getDetailedReactions } = useReactions()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reactionData, setReactionData] = useState<Record<string, { count: number; users: any[] }>>({})
  const [activeTab, setActiveTab] = useState<string>("all")

  useEffect(() => {
    const fetchReactionDetails = async () => {
      if (!open || !postId) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await getDetailedReactions(postId)

        if (data && data.reactions) {
          setReactionData(data.reactions)

          // Set the active tab to the reaction with the most users
          const mostPopularReaction = Object.entries(data.reactions)
            .sort(([, a], [, b]) => b.count - a.count)
            .find(([, reaction]) => reaction.count > 0)

          if (mostPopularReaction) {
            setActiveTab(mostPopularReaction[0])
          } else {
            setActiveTab("all")
          }
        } else {
          setReactionData({})
        }
      } catch (err) {
        console.error("Error fetching reaction details:", err)
        setError("Failed to load reaction details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReactionDetails()
  }, [open, postId, getDetailedReactions])

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

  // Calculate total reactions
  const totalReactions = Object.values(reactionData).reduce((sum, reaction) => sum + reaction.count, 0)

  // Get all users across all reaction types
  const allUsers = Object.values(reactionData).flatMap((reaction) => reaction.users || [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reactions</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16 rounded-full" />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        ) : (
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="grid grid-cols-7 mb-4">
              <TabsTrigger value="all" className="text-xs">
                All ({totalReactions})
              </TabsTrigger>
              {Object.entries(reactionData).map(
                ([type, data]) =>
                  data.count > 0 && (
                    <TabsTrigger key={type} value={type} className="text-xs">
                      {getEmojiForType(type)} ({data.count})
                    </TabsTrigger>
                  ),
              )}
            </TabsList>

            <TabsContent value="all" className="max-h-[300px] overflow-y-auto">
              {allUsers.length > 0 ? (
                <div className="space-y-3">
                  {allUsers.map((user, index) => (
                    <div key={`${user.id || user.username}-${index}`} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.avatar || `/placeholder.svg?height=32&width=32&query=${user.username}`}
                        />
                        <AvatarFallback>
                          {user.displayName?.substring(0, 2) || user.username?.substring(0, 2) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.displayName || user.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">No reactions yet</div>
              )}
            </TabsContent>

            {Object.entries(reactionData).map(([type, data]) => (
              <TabsContent key={type} value={type} className="max-h-[300px] overflow-y-auto">
                {data.users && data.users.length > 0 ? (
                  <div className="space-y-3">
                    {data.users.map((user, index) => (
                      <div key={`${user.id || user.username}-${index}`} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.avatar || `/placeholder.svg?height=32&width=32&query=${user.username}`}
                          />
                          <AvatarFallback>
                            {user.displayName?.substring(0, 2) || user.username?.substring(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.displayName || user.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">No {type} reactions yet</div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
