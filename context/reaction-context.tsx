"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { ReactionService, type ReactionType } from "@/lib/services/reaction-service"
import { createReactionNotification } from "@/lib/actions/notification-actions"

interface ReactionContextType {
  getUserReaction: (postId: number | string) => Promise<{ id: string; type: ReactionType } | null>
  addReaction: (
    postId: number | string,
    type: ReactionType,
    documentId?: string,
    userId?: string,
    userDocumentId?: string,
    postAuthorId?: string | number,
  ) => Promise<any>
  getReactionCounts: (postId: number | string) => Promise<any>
  getDetailedReactions: (postId: number | string) => Promise<any>
}

const ReactionContext = createContext<ReactionContextType | undefined>(undefined)

export function ReactionProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Record<string, any>>({})
  const { user, isAuthenticated } = useAuth()

  const getUserReaction = useCallback(
    async (postId: number | string) => {
      try {
        if (!isAuthenticated || !user?.id) {
          return null
        }

        const result = await ReactionService.getUserReaction(postId)
        return result
      } catch (error) {
        console.error("Error getting user reaction:", error)
        return null
      }
    },
    [isAuthenticated, user],
  )

  const addReaction = useCallback(
    async (
      postId: number | string,
      type: ReactionType,
      documentId?: string,
      userId?: string,
      userDocumentId?: string,
      postAuthorId?: string | number,
    ) => {
      try {
        if (!isAuthenticated || !user?.id) {
          throw new Error("User not authenticated")
        }

        const existingReaction = await ReactionService.getUserReaction(postId, userId || user.id)
        const isNewReaction = !existingReaction

        console.log("[v0] Adding reaction - isNewReaction:", isNewReaction, "postAuthorId:", postAuthorId)

        const result = await ReactionService.addReaction(
          postId,
          type,
          documentId,
          userId || user.id,
          userDocumentId || user.documentId,
        )

        if (isNewReaction && result && postAuthorId && postAuthorId.toString() !== (userId || user.id).toString()) {
          console.log("[v0] Creating notification record for post author:", postAuthorId)
          try {
            await createReactionNotification(
              postId.toString(),
              postAuthorId.toString(),
              (userId || user.id).toString(),
              user.displayName || user.username || "Someone",
              type,
            )
            console.log("[v0] Notification record created successfully (no push notification sent)")
          } catch (notificationError) {
            console.error("[v0] Failed to create notification record:", notificationError)
          }
        } else {
          console.log(
            "[v0] Skipping notification - isNewReaction:",
            isNewReaction,
            "postAuthorId:",
            postAuthorId,
            "isSelfReaction:",
            postAuthorId?.toString() === (userId || user.id).toString(),
          )
        }

        setCache((prev) => {
          const newCache = { ...prev }
          delete newCache[`counts-${postId}`]
          delete newCache[`detailed-${postId}`]
          delete newCache[`user-reaction-${postId}`]
          return newCache
        })

        return result
      } catch (error) {
        console.error("Error adding reaction:", error)
        throw error
      }
    },
    [isAuthenticated, user],
  )

  const getReactionCounts = useCallback(
    async (postId: number | string) => {
      const cacheKey = `counts-${postId}`

      if (cache[cacheKey]) {
        return cache[cacheKey]
      }

      try {
        const counts = await ReactionService.getReactionCounts(postId)

        setCache((prev) => ({
          ...prev,
          [cacheKey]: counts,
        }))

        return counts
      } catch (error) {
        console.error("Error getting reaction counts:", error)
        return {
          like: { count: 0, users: [] },
          love: { count: 0, users: [] },
          haha: { count: 0, users: [] },
          wow: { count: 0, users: [] },
          sad: { count: 0, users: [] },
          angry: { count: 0, users: [] },
        }
      }
    },
    [cache],
  )

  const getDetailedReactions = useCallback(
    async (postId: number | string) => {
      const cacheKey = `detailed-${postId}`

      if (cache[cacheKey]) {
        return cache[cacheKey]
      }

      try {
        const detailed = await ReactionService.getReactionCounts(postId)

        setCache((prev) => ({
          ...prev,
          [cacheKey]: { reactions: detailed },
        }))

        return { reactions: detailed }
      } catch (error) {
        console.error("Error getting detailed reactions:", error)
        return {
          reactions: {
            like: { count: 0, users: [] },
            love: { count: 0, users: [] },
            haha: { count: 0, users: [] },
            wow: { count: 0, users: [] },
            sad: { count: 0, users: [] },
            angry: { count: 0, users: [] },
          },
        }
      }
    },
    [cache],
  )

  return (
    <ReactionContext.Provider
      value={{
        getUserReaction,
        addReaction,
        getReactionCounts,
        getDetailedReactions,
      }}
    >
      {children}
    </ReactionContext.Provider>
  )
}

export function useReactions() {
  const context = useContext(ReactionContext)
  if (context === undefined) {
    throw new Error("useReactions must be used within a ReactionProvider")
  }
  return context
}
