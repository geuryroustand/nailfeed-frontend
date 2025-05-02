"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { ReactionService, type ReactionType } from "@/lib/services/reaction-service"
import { useAuth } from "@/context/auth-context"

interface ReactionContextType {
  getUserReaction: (postId: string | number) => Promise<{ id: string; type: ReactionType } | null>
  addReaction: (postId: string | number, type: ReactionType) => Promise<any>
  getReactionCounts: (postId: string | number) => Promise<Record<ReactionType, number>>
  isLoading: boolean
  error: string | null
}

const ReactionContext = createContext<ReactionContextType | undefined>(undefined)

export function ReactionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()

  const getUserReaction = async (postId: string | number) => {
    if (!isAuthenticated || !user?.id) {
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      const reaction = await ReactionService.getUserReaction(postId, user.id)
      return reaction
    } catch (err) {
      console.error("Error getting user reaction:", err)
      setError("Failed to get your reaction")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const addReaction = async (postId: string | number, type: ReactionType) => {
    if (!isAuthenticated || !user?.id) {
      throw new Error("You must be logged in to react to posts")
    }

    try {
      setIsLoading(true)
      setError(null)
      const result = await ReactionService.addReaction(postId, user.id, type)
      return result
    } catch (err) {
      console.error("Error adding reaction:", err)
      setError("Failed to add your reaction")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getReactionCounts = async (postId: string | number) => {
    try {
      setIsLoading(true)
      setError(null)
      const counts = await ReactionService.getReactionCounts(postId)
      return counts
    } catch (err) {
      console.error("Error getting reaction counts:", err)
      setError("Failed to get reaction counts")
      return {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ReactionContext.Provider
      value={{
        getUserReaction,
        addReaction,
        getReactionCounts,
        isLoading,
        error,
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
