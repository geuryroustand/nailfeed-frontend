"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback } from "react"
import { ReactionService, type ReactionType } from "@/lib/services/reaction-service"

interface ReactionContextType {
  getUserReaction: (postId: number | string) => Promise<{ id: string; type: ReactionType } | null>
  addReaction: (postId: number | string, type: ReactionType, documentId?: string) => Promise<any>
  getReactionCounts: (postId: number | string) => Promise<any>
  getDetailedReactions: (postId: number | string) => Promise<any>
}

const ReactionContext = createContext<ReactionContextType | undefined>(undefined)

export function ReactionProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Record<string, any>>({})

  const getUserReaction = useCallback(async (postId: number | string) => {
    try {
      // Get the current user ID from auth context or localStorage
      let userId = null
      if (typeof window !== "undefined") {
        const userStr = localStorage.getItem("user")
        if (userStr) {
          const user = JSON.parse(userStr)
          userId = user.id
        } else {
          // Try to get from cookie
          const cookies = document.cookie.split(";")
          const userIdCookie = cookies.find((cookie) => cookie.trim().startsWith("userId="))
          if (userIdCookie) {
            userId = userIdCookie.split("=")[1].trim()
          }
        }
      }

      if (!userId) {
        return null
      }

      const result = await ReactionService.getUserReaction(postId, userId)
      return result
    } catch (error) {
      console.error("Error getting user reaction:", error)
      return null
    }
  }, [])

  const addReaction = useCallback(async (postId: number | string, type: ReactionType, documentId?: string) => {
    try {
      // Get the current user ID and documentId from auth context or localStorage
      let userId = null
      let userDocumentId = null

      if (typeof window !== "undefined") {
        const userStr = localStorage.getItem("user")
        if (userStr) {
          const user = JSON.parse(userStr)
          userId = user.id
          userDocumentId = user.documentId
        } else {
          // Try to get from cookie
          const cookies = document.cookie.split(";")
          const userIdCookie = cookies.find((cookie) => cookie.trim().startsWith("userId="))
          if (userIdCookie) {
            userId = userIdCookie.split("=")[1].trim()
            // For documentId, we'll use the same value as userId if not available
            userDocumentId = userId
          }
        }
      }

      if (!userId || !userDocumentId) {
        throw new Error("User not authenticated")
      }

      const result = await ReactionService.addReaction(postId, type, documentId, userId, userDocumentId)

      // Invalidate cache for this post
      setCache((prev) => {
        const newCache = { ...prev }
        delete newCache[`counts-${postId}`]
        delete newCache[`detailed-${postId}`]
        return newCache
      })

      return result
    } catch (error) {
      console.error("Error adding reaction:", error)
      throw error
    }
  }, [])

  const getReactionCounts = useCallback(
    async (postId: number | string) => {
      const cacheKey = `counts-${postId}`

      // Check cache first
      if (cache[cacheKey]) {
        return cache[cacheKey]
      }

      try {
        const counts = await ReactionService.getReactionCounts(postId)

        // Cache the result
        setCache((prev) => ({
          ...prev,
          [cacheKey]: counts,
        }))

        return counts
      } catch (error) {
        console.error("Error getting reaction counts:", error)
        return {
          like: 0,
          love: 0,
          haha: 0,
          wow: 0,
          sad: 0,
          angry: 0,
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
        const detailed = await ReactionService.getDetailedReactions(postId)

        // Cache the result
        setCache((prev) => ({
          ...prev,
          [cacheKey]: detailed,
        }))

        return detailed
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
