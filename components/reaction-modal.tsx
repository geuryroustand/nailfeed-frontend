"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReactionUser {
  id: string | number
  username: string
  displayName?: string
  avatar?: string
}

interface ReactionItem {
  emoji: string
  label: string
  count: number
  users: ReactionUser[]
}

interface ReactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reactions: ReactionItem[]
  totalCount: number
  postId?: string | number
}

export function ReactionModal({ open, onOpenChange, reactions, totalCount, postId }: ReactionModalProps) {
  const [activeTab, setActiveTab] = useState("all")

  const availableReactions = reactions.filter((reaction) => reaction.count > 0)

  // Sort reactions by count (highest first)
  const sortedReactions = [...availableReactions].sort((a, b) => b.count - a.count)

  // Get all users across all reaction types
  const allUsers = reactions.flatMap((reaction) =>
    reaction.users.map((user) => ({
      ...user,
      reactionEmoji: reaction.emoji || "👍", // Ensure emoji has a default value
      reactionLabel: reaction.label || "default", // Ensure label has a default value
    })),
  )

  // Get filtered users based on active tab
  const filteredUsers =
    activeTab === "all"
      ? allUsers
      : reactions
          .find((r) => r.emoji === activeTab)
          ?.users.map((user) => ({
            ...user,
            reactionEmoji: activeTab,
            reactionLabel: reactions.find((r) => r.emoji === activeTab)?.label || "default",
          })) || []

  useEffect(() => {
    // Reset to "all" tab when modal opens
    if (open) {
      setActiveTab("all")
    }
  }, [open, reactions])

  useEffect(() => {
    if (open && totalCount === 0 && sortedReactions.length > 0) {
      setActiveTab(sortedReactions[0].emoji)
    }
  }, [open, totalCount, sortedReactions])

  // Get background color based on reaction type
  const getReactionColor = (label = "default"): string => {
    // Ensure label is a string and not undefined
    if (!label) return "bg-gray-50"

    switch (label.toLowerCase()) {
      case "love":
        return "bg-pink-50"
      case "haha":
        return "bg-yellow-50"
      case "wow":
        return "bg-purple-50"
      case "sad":
        return "bg-blue-50"
      case "angry":
        return "bg-red-50"
      case "like":
        return "bg-blue-50"
      default:
        return "bg-gray-50"
    }
  }

  // Debug information

  // Helper function to get user display name with fallbacks
  const getUserDisplayName = (user) => {
    return user.displayName || user.username || `User ${user.id}`
  }

  // Helper function to get avatar URL with fallback
  const getAvatarUrl = (user) => {
    return user.avatar || `/placeholder.svg?height=40&width=40&query=user`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold">Reactions</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b overflow-x-auto">
            <TabsList className="h-auto p-1 w-full bg-gray-50 flex">
              {totalCount > 0 && (
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white rounded-md px-3 py-1.5 flex items-center gap-1"
                >
                  All <span className="text-xs text-gray-500 ml-1">({totalCount})</span>
                </TabsTrigger>
              )}

              {sortedReactions.map((reaction) => (
                <TabsTrigger
                  key={reaction.emoji}
                  value={reaction.emoji}
                  className="data-[state=active]:bg-white rounded-md px-3 py-1.5 flex items-center gap-1"
                >
                  <span className="text-lg">{reaction.emoji}</span>
                  <span className="text-xs text-gray-500 ml-1">({reaction.count})</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ScrollArea className="h-[50vh] max-h-[400px]">
              <div className="p-2">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <Link
                      href={`/profile/${user.username}`}
                      key={user.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={getAvatarUrl(user) || "/placeholder.svg"}
                          alt={getUserDisplayName(user)}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg?height=40&width=40&query=user`
                          }}
                        />
                      </div>
                      <span className="font-medium">{getUserDisplayName(user)}</span>
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${getReactionColor(user.reactionLabel)} ml-auto`}
                      >
                        <span className="text-xl" role="img" aria-label={user.reactionLabel || "reaction"}>
                          {user.reactionEmoji || "👍"}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    {activeTab === "all"
                      ? "No reactions found for this post"
                      : `No ${reactions.find((r) => r.emoji === activeTab)?.label || ""} reactions to display`}
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
