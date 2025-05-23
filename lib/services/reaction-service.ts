"use client"

import { apiClient } from "@/lib/api-client"
import qs from "qs"

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry"

// Get API_URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"

export class ReactionService {
  // Get reaction counts for a post
  static async getReactionCounts(postId: string | number): Promise<Record<ReactionType, number> | any> {
    try {
      // Build query to get all reactions for this post with user information
      const query = {
        filters: {
          post: {
            id: {
              $eq: postId,
            },
          },
        },
        populate: {
          user: true,
        },
      }

      const queryString = qs.stringify(query, { encodeValuesOnly: true })

      const response = await apiClient.get(`/api/likes?${queryString}`)

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
      if (response.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((reaction) => {
          // Check if reaction exists
          if (!reaction) {
            return
          }

          // Handle both possible API response structures
          let type: ReactionType | undefined
          let userData = null

          if (reaction.type) {
            // Direct structure
            type = reaction.type as ReactionType
            userData = reaction.user
          } else if (reaction.attributes && reaction.attributes.type) {
            // Nested structure
            type = reaction.attributes.type as ReactionType
            userData = reaction.attributes.user?.data
          } else {
            return
          }

          if (type && reactionData[type] !== undefined) {
            reactionData[type].count++

            // Add user information if available
            if (userData) {
              // Extract user data based on API response structure
              let username, displayName, avatarUrl

              if (userData.attributes) {
                // Nested structure (Strapi v5)
                username = userData.attributes.username || "user"
                displayName = userData.attributes.displayName || username

                // Try to get avatar URL from different possible structures
                if (userData.attributes.avatar?.data?.attributes?.url) {
                  avatarUrl = userData.attributes.avatar.data.attributes.url
                } else if (userData.attributes.avatar?.url) {
                  avatarUrl = userData.attributes.avatar.url
                }
              } else {
                // Direct structure
                username = userData.username || "user"
                displayName = userData.displayName || username

                // Try to get avatar URL from different possible structures
                if (userData.avatar?.data?.attributes?.url) {
                  avatarUrl = userData.avatar.data.attributes.url
                } else if (userData.avatar?.url) {
                  avatarUrl = userData.avatar.url
                }
              }

              const user = {
                id: userData.id,
                username: username,
                displayName: displayName,
                avatar: avatarUrl || null,
              }

              reactionData[type].users.push(user)
            }
          }
        })
      }

      return reactionData
    } catch (error) {
      console.error("Error getting reaction counts:", error)
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

  // Get user's reaction for a post
  static async getUserReaction(
    postId: string | number,
    userId?: string | number,
  ): Promise<{ id: string; type: ReactionType } | null> {
    try {
      // Check if userId was provided
      if (!userId) {
        // Try to get user ID from localStorage or context
        const userStr = localStorage.getItem("user")
        if (!userStr) {
          return null // User not authenticated
        }

        try {
          const user = JSON.parse(userStr)
          userId = user.id
        } catch (e) {
          console.error("Error parsing user from localStorage:", e)
          return null
        }

        if (!userId) {
          return null // User ID missing
        }
      }

      // Build query to find user's reaction for this post
      const query = {
        filters: {
          post: {
            id: {
              $eq: postId,
            },
          },
          user: {
            id: {
              $eq: userId,
            },
          },
        },
      }

      const queryString = qs.stringify(query, { encodeValuesOnly: true })

      const response = await apiClient.get(`/api/likes?${queryString}`)

      // Check if user has reacted
      if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const reaction = response.data.data[0]

        // Handle both possible API response structures
        let type: ReactionType
        let id: string

        if (reaction.type) {
          // Direct structure
          type = reaction.type as ReactionType
          id = reaction.id.toString()
        } else if (reaction.attributes && reaction.attributes.type) {
          // Nested structure
          type = reaction.attributes.type as ReactionType
          id = reaction.id.toString()
        } else {
          return null
        }

        return {
          id,
          type,
        }
      }

      return null
    } catch (error) {
      console.error("Error getting user reaction:", error)
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
        const removed = await this.removeReaction(existingReaction.id)
        if (!removed) {
          throw new Error("Failed to remove reaction")
        }
        return null
      }

      // If user already has a reaction but wants to change it
      if (existingReaction) {
        // According to Strapi docs, we should delete the old reaction and create a new one
        // This is more reliable than trying to update
        try {
          // First remove the existing reaction
          await this.removeReaction(existingReaction.id)

          // Then create a new one with the new type
          return await this.createReaction(userDocumentId.toString(), postDocumentId || postId.toString(), type)
        } catch (error) {
          console.error("Failed to change reaction:", error)
          throw new Error("Failed to change your reaction")
        }
      }

      // Create a new reaction if none exists
      return await this.createReaction(userDocumentId.toString(), postDocumentId || postId.toString(), type)
    } catch (error) {
      console.error("ReactionService.addReaction error:", error)
      throw new Error("Failed to add reaction: " + (error.message || "Unknown error"))
    }
  }

  // Create a new reaction (helper method)
  private static async createReaction(
    userDocumentId: string,
    postDocumentId: string,
    type: ReactionType,
  ): Promise<{ id: string; type: ReactionType } | null> {
    // Following Strapi v5 documentation for creating records
    const payload = {
      data: {
        type,
        user: userDocumentId,
        post: postDocumentId,
      },
    }

    try {
      console.log("Creating reaction with payload:", payload)
      const response = await apiClient.post("/api/likes", payload)

      if (response.data && response.data.data) {
        return {
          id: response.data.data.id.toString(),
          type: response.data.data.attributes?.type || type,
        }
      }

      throw new Error("Invalid response from API")
    } catch (error) {
      console.error("Error creating reaction with axios:", error)

      // Try with native fetch as a fallback
      try {
        const token = this.getAuthToken()

        console.log("Trying to create reaction with fetch")
        const fetchResponse = await fetch(`${API_URL}/api/likes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          credentials: "include",
        })

        if (fetchResponse.ok) {
          const data = await fetchResponse.json()
          if (data && data.data) {
            return {
              id: data.data.id.toString(),
              type: data.data.attributes?.type || type,
            }
          }
        } else {
          const errorText = await fetchResponse.text()
          console.error(`Fetch create failed with status: ${fetchResponse.status}`, errorText)
          throw new Error(`Failed to create reaction: ${fetchResponse.status}`)
        }
      } catch (fetchError) {
        console.error("Native fetch create failed:", fetchError)
        throw new Error("Failed to create reaction with both axios and fetch")
      }
    }

    throw new Error("Failed to create reaction after all attempts")
  }

  // Remove a reaction
  static async removeReaction(reactionId: string | number): Promise<boolean> {
    try {
      console.log(`Removing reaction with ID: ${reactionId}`)
      await apiClient.delete(`/api/likes/${reactionId}`)
      return true
    } catch (deleteError) {
      console.error("Error with axios delete:", deleteError)

      // Try with native fetch as a fallback
      try {
        const token = this.getAuthToken()

        console.log(`Trying to remove reaction with fetch: ${reactionId}`)
        const fetchResponse = await fetch(`${API_URL}/api/likes/${reactionId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        })

        if (fetchResponse.ok) {
          return true
        } else {
          const errorText = await fetchResponse.text()
          console.error(`Fetch delete failed with status: ${fetchResponse.status}`, errorText)
          throw new Error(`Failed to delete reaction: ${fetchResponse.status}`)
        }
      } catch (fetchError) {
        console.error("Native fetch delete failed:", fetchError)
        throw new Error("Failed to remove reaction with both axios and fetch")
      }
    }

    return false
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
      // Get the API URL from environment variables
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

      // Get token from localStorage or cookie
      let token = null
      if (typeof window !== "undefined") {
        token = localStorage.getItem("jwt")
        if (!token) {
          const cookies = document.cookie.split(";")
          const jwtCookie = cookies.find((cookie) => cookie.trim().startsWith("jwt="))
          if (jwtCookie) {
            token = jwtCookie.split("=")[1].trim()
          }
        }
      }

      // Fetch detailed reactions with users
      const response = await fetch(`${API_URL}/api/likes?filters[post][id][$eq]=${postId}&populate=user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
          const type = like.attributes?.type || "like"
          const user = like.attributes?.user?.data?.attributes || {}

          if (!reactions[type]) {
            reactions[type] = { count: 0, users: [] }
          }

          reactions[type].count++
          reactions[type].users.push({
            id: like.attributes?.user?.data?.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: user.avatar?.data?.attributes?.url ? `${API_URL}${user.avatar.data.attributes.url}` : null,
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
