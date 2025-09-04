"use client"
import qs from "qs"

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry"

// Get API_URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"

export class ReactionService {
  static async getReactionCounts(postId: string | number): Promise<Record<ReactionType, number> | any> {
    try {
      console.log("[v0] ReactionService.getReactionCounts called with postId:", postId)

      const query = {
        filters: {
          post: { $eq: postId },
        },
        populate: {
          user: {
            fields: ["id", "username", "displayName"],
            populate: {
              profileImage: {
                fields: ["url", "formats"],
              },
            },
          },
        },
        fields: ["type", "createdAt"],
        sort: ["createdAt:desc"],
        pagination: {
          page: 1,
          pageSize: 10,
        },
      }

      const queryString = qs.stringify(query, { encodeValuesOnly: true })
      const endpoint = `/api/likes?${queryString}`
      console.log("[v0] Making API call via auth proxy to", endpoint)

      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method: "GET",
        }),
        credentials: "include",
      })

      if (!response.ok) {
        console.log("[v0] API response not ok:", response.status, response.statusText)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] API response received:", data)

      // Initialize counts and users by reaction type
      const reactionData = {
        like: { count: 0, users: [] },
        love: { count: 0, users: [] },
        haha: { count: 0, users: [] },
        wow: { count: 0, users: [] },
        sad: { count: 0, users: [] },
        angry: { count: 0, users: [] },
      }

      // Count reactions by type and collect user information
      if (data && Array.isArray(data.data)) {
        console.log("[v0] Processing reactions data:", data.data.length, "reactions found")

        data.data.forEach((reaction) => {
          // Check if reaction exists
          if (!reaction) {
            return
          }

          const type = (reaction.attributes?.type ?? reaction.type) as ReactionType
          const userNode = reaction.attributes?.user?.data ?? reaction.user ?? null
          const userData = userNode?.attributes ?? userNode ?? null

          console.log("[v0] Processing reaction:", {
            type,
            hasUser: !!userData,
          })

          if (type && reactionData[type] !== undefined) {
            reactionData[type].count++

            // Add user information if available
            if (userData) {
              const user = {
                id: userData.id,
                username: userData.username || "user",
                displayName: userData.displayName || userData.username || "user",
                avatar: userData.profileImage?.url || null,
                profileImage: userData.profileImage || null,
              }

              reactionData[type].users.push(user)
            }
          }
        })
      }

      console.log("[v0] Final reaction data:", reactionData)
      return reactionData
    } catch (error) {
      console.error("[v0] Error getting reaction counts:", error)
      // Return empty counts on error
      return {
        like: { count: 0, users: [] },
        love: { count: 0, users: [] },
        haha: { count: 0, users: [] },
        wow: { count: 0, users: [] },
        sad: { count: 0, users: [] },
        angry: { count: 0, users: [] },
      }
    }
  }

  static async getUserReaction(
    postId: string | number,
    userId?: string | number,
  ): Promise<{ id: string; documentId: string; type: ReactionType } | null> {
    try {
      console.log("[v0] ReactionService.getUserReaction called with postId:", postId, "userId:", userId)

      // Check if userId was provided
      if (!userId) {
        // Try to get user ID from localStorage or context
        const userStr = localStorage.getItem("user")
        if (!userStr) {
          console.log("[v0] No user found in localStorage")
          return null // User not authenticated
        }

        try {
          const user = JSON.parse(userStr)
          userId = user.id
          console.log("[v0] User ID from localStorage:", userId)
        } catch (e) {
          console.error("[v0] Error parsing user from localStorage:", e)
          return null
        }

        if (!userId) {
          return null // User ID missing
        }
      }

      const query = {
        filters: {
          post: { $eq: postId },
          user: { id: { $eq: userId } },
        },
      }

      const queryString = qs.stringify(query, { encodeValuesOnly: true })
      const endpoint = `/api/likes?${queryString}`
      console.log("[v0] Making API call to check user reaction with query:", queryString)

      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method: "GET",
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] User reaction API response:", data)

      // Check if user has reacted
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        const reaction = data.data[0]

        const type = (reaction.attributes?.type ?? reaction.type) as ReactionType
        const id = reaction.id.toString()
        const documentId = reaction.documentId

        console.log("[v0] User has existing reaction:", {
          id,
          documentId,
          type,
        })
        return { id, documentId, type }
      }

      console.log("[v0] No existing reaction found for user")
      return null
    } catch (error) {
      console.error("[v0] Error getting user reaction:", error)
      return null
    }
  }

  // Add or change a reaction (simplified approach based on Strapi documentation)
  static async addReaction(
    postId: string | number,
    type: ReactionType,
    postDocumentId?: string,
    userId?: string | number,
    userDocumentId?: string,
  ): Promise<{ id: string; type: ReactionType } | null> {
    try {
      // Check if user information was provided
      if (!userId || !userDocumentId) {
        // Try to get user info from localStorage
        const userStr = localStorage.getItem("user")
        if (!userStr) {
          throw new Error("User not authenticated")
        }

        try {
          const user = JSON.parse(userStr)
          userId = user.id
          userDocumentId = user.documentId || user.id
        } catch (e) {
          console.error("Error parsing user from localStorage:", e)
          throw new Error("Failed to parse user data")
        }

        if (!userId || !userDocumentId) {
          throw new Error("User ID or document ID missing")
        }
      }

      // First check if user already has a reaction
      const existingReaction = await this.getUserReaction(postId, userId.toString())

      // If removing the same reaction (toggle off)
      if (existingReaction && existingReaction.type === type) {
        const removed = await this.removeReaction(existingReaction.documentId)
        if (!removed) {
          throw new Error("Failed to remove reaction")
        }
        return null
      }

      // If user already has a reaction but wants to change it
      if (existingReaction) {
        console.log("[v0] User changing reaction from", existingReaction.type, "to", type)
        return await this.updateReaction(existingReaction.documentId, type)
      }

      // Create a new reaction if none exists
      console.log("[v0] User creating new reaction:", type)
      return await this.createReaction(userDocumentId.toString(), postDocumentId || postId.toString(), type)
    } catch (error) {
      console.error("ReactionService.addReaction error:", error)
      throw new Error("Failed to add reaction: " + (error.message || "Unknown error"))
    }
  }

  private static async updateReaction(
    reactionDocumentId: string,
    newType: ReactionType,
  ): Promise<{ id: string; type: ReactionType } | null> {
    try {
      console.log("[v0] Updating reaction", reactionDocumentId, "to type:", newType)

      const payload = {
        data: {
          type: newType,
        },
      }

      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: `/api/likes/${reactionDocumentId}`,
          method: "PUT",
          data: payload,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Auth proxy PUT response not ok:", response.status, response.statusText, errorText)
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Update reaction response:", data)

      if (data && data.data) {
        return {
          id: data.data.id.toString(),
          type: data.data.type || newType,
        }
      }

      throw new Error("Invalid response from API")
    } catch (error) {
      console.error("[v0] Error updating reaction:", error)
      throw new Error("Failed to update reaction: " + (error.message || "Unknown error"))
    }
  }

  // Create a new reaction (helper method)
  private static async createReaction(
    userDocumentId: string,
    postDocumentId: string,
    type: ReactionType,
  ): Promise<{ id: string; type: ReactionType } | null> {
    const payload = {
      data: {
        type,
        post: {
          connect: [{ documentId: postDocumentId }],
        },
      },
    }

    console.log("[v0] Creating reaction with payload:", payload)

    try {
      console.log("[v0] Creating reaction with payload:", payload)

      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/api/likes",
          method: "POST",
          data: payload,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Auth proxy response not ok:", response.status, response.statusText, errorText)
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Create reaction response:", data)

      if (data && data.data) {
        const responseType = data.data.attributes?.type ?? data.data.type ?? type
        return {
          id: data.data.id.toString(),
          type: responseType,
        }
      }

      throw new Error("Invalid response from API")
    } catch (error) {
      console.error("[v0] Error creating reaction:", error)
      throw new Error("Failed to create reaction: " + (error.message || "Unknown error"))
    }
  }

  // Remove a reaction
  static async removeReaction(reactionDocumentId: string | number): Promise<boolean> {
    try {
      console.log("[v0] Removing reaction with documentId:", reactionDocumentId)

      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: `/api/likes/${reactionDocumentId}`,
          method: "DELETE",
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Auth proxy delete response not ok:", response.status, response.statusText, errorText)
        throw new Error(`Failed to delete reaction: ${response.status}`)
      }

      console.log("[v0] Reaction removed successfully")
      return true
    } catch (error) {
      console.error("[v0] Error removing reaction:", error)
      return false
    }
  }

  // Helper method to get auth token
  private static getAuthToken(): string | null {
    if (typeof window === "undefined") return null

    let token = localStorage.getItem("jwt")
    if (!token) {
      const cookies = document.cookie.split(";")
      const jwtCookie = cookies.find((cookie) => cookie.trim().startsWith("jwt="))
      if (jwtCookie) {
        token = jwtCookie.split("=")[1].trim()
      }
    }
    return token
  }

  static async getDetailedReactions(postId: number | string): Promise<any> {
    try {
      console.log("[v0] ReactionService.getDetailedReactions called with postId:", postId)

      const query = {
        filters: {
          post: { $eq: postId },
        },
        populate: {
          user: {
            fields: ["id", "username", "displayName"],
            populate: {
              profileImage: {
                fields: ["url", "formats"],
              },
            },
          },
        },
        fields: ["type", "createdAt"],
        sort: ["createdAt:desc"],
        pagination: {
          page: 1,
          pageSize: 10,
        },
      }

      const queryString = qs.stringify(query, { encodeValuesOnly: true })
      const endpoint = `/api/likes?${queryString}`

      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method: "GET",
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Process the data to group by reaction type
      const reactions: Record<string, { count: number; users: any[] }> = {
        like: { count: 0, users: [] },
        love: { count: 0, users: [] },
        haha: { count: 0, users: [] },
        wow: { count: 0, users: [] },
        sad: { count: 0, users: [] },
        angry: { count: 0, users: [] },
      }

      // Process the likes data
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((like: any) => {
          const type = like.attributes?.type ?? like.type ?? "like"
          const userNode = like.attributes?.user?.data ?? like.user ?? {}
          const user = userNode?.attributes ?? userNode ?? {}

          if (!reactions[type]) {
            reactions[type] = { count: 0, users: [] }
          }

          reactions[type].count++
          reactions[type].users.push({
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: user.profileImage?.url || null,
            profileImage: user.profileImage || null,
          })
        })
      }

      return { reactions }
    } catch (error) {
      console.error("Error fetching detailed reactions:", error)
      throw error
    }
  }
}
