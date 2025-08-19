"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import {
  getUserReaction as getUserReactionAction,
  addReaction as addReactionAction,
  getReactionCounts as getReactionCountsAction,
  type ReactionType,
} from "@/app/actions/reaction-actions"

interface ReactionContextType {
  getUserReaction: (postId: number | string) => Promise<{ id: string; type: ReactionType } | null>
  addReaction: (postId: number | string, type: ReactionType, documentId?: string) => Promise<any>
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

        const result = await getUserReactionAction(postId)
        return result
      } catch (error) {
        console.error("Error getting user reaction:", error)
        return null
      }
    },
    [isAuthenticated, user],
  )

  const addReaction = useCallback(
    async (postId: number | string, type: ReactionType, documentId?: string) => {
      try {
        if (!isAuthenticated || !user?.id) {
          throw new Error("User not authenticated")
        }

        const result = await addReactionAction(postId, type, documentId)

        if (!result.success) {
          throw new Error(result.error || "Failed to add reaction")
        }

        // Invalidate cache for this post
        setCache((prev) => {
          const newCache = { ...prev }
          delete newCache[`counts-${postId}`]
          delete newCache[`detailed-${postId}`]
          return newCache
        })

        return result.reaction
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

      // Check cache first
      if (cache[cacheKey]) {
        return cache[cacheKey]
      }

      try {
        const counts = await getReactionCountsAction(postId)

        // Cache the result
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

      // Check cache first
      if (cache[cacheKey]) {
        return cache[cacheKey]
      }

      try {
        const detailed = await getReactionCountsAction(postId)

        // Cache the result
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
