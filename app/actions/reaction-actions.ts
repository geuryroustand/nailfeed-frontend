"use server"

import { getCurrentUser } from "./auth-actions"
import { revalidatePath } from "next/cache"

const API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry"

export async function getUserReaction(postId: string | number): Promise<{ id: string; type: ReactionType } | null> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return null
    }

    const response = await fetch(
      `${API_URL}/api/likes?filters[post][documentId][$eq]=${postId}&filters[user][documentId][$eq]=${user.documentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      console.error(`Failed to get user reaction: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const reaction = data.data[0]
      return {
        id: reaction.id.toString(),
        type: reaction.attributes?.type || reaction.type,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting user reaction:", error)
    return null
  }
}

export async function addReaction(
  postId: string | number,
  type: ReactionType,
  postDocumentId?: string,
): Promise<{ success: boolean; reaction?: { id: string; type: ReactionType }; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Check if user already has a reaction
    const existingReaction = await getUserReaction(postId)

    // If removing the same reaction (toggle off)
    if (existingReaction && existingReaction.type === type) {
      const removed = await removeReaction(existingReaction.id)
      if (removed.success) {
        revalidatePath("/")
        return { success: true }
      } else {
        return { success: false, error: "Failed to remove reaction" }
      }
    }

    // If user already has a reaction but wants to change it
    if (existingReaction) {
      // Remove the existing reaction first
      await removeReaction(existingReaction.id)
    }

    const payload = {
      data: {
        type,
        user: {
          connect: [{ documentId: user.documentId }],
        },
        post: {
          connect: [{ documentId: postDocumentId || postId }],
        },
      },
    }

    const response = await fetch(`${API_URL}/api/likes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to create reaction: ${response.status}`, errorText)
      return { success: false, error: `Failed to create reaction: ${response.status}` }
    }

    const data = await response.json()

    if (data.data) {
      revalidatePath("/")
      return {
        success: true,
        reaction: {
          id: data.data.id.toString(),
          type: data.data.attributes?.type || type,
        },
      }
    }

    return { success: false, error: "Invalid response from API" }
  } catch (error) {
    console.error("Error adding reaction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function removeReaction(reactionId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const response = await fetch(`${API_URL}/api/likes/${reactionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    })

    if (!response.ok) {
      console.error(`Failed to delete reaction: ${response.status}`)
      return { success: false, error: `Failed to delete reaction: ${response.status}` }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error removing reaction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getReactionCounts(
  postId: string | number,
): Promise<Record<ReactionType, { count: number; users: any[] }>> {
  try {
    const response = await fetch(`${API_URL}/api/likes?filters[post][documentId][$eq]=${postId}&populate=user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    })

    if (!response.ok) {
      console.error(`Failed to get reaction counts: ${response.status}`)
      return {
        like: { count: 0, users: [] },
        love: { count: 0, users: [] },
        haha: { count: 0, users: [] },
        wow: { count: 0, users: [] },
        sad: { count: 0, users: [] },
        angry: { count: 0, users: [] },
      }
    }

    const data = await response.json()

    // Initialize counts and users by reaction type
    const reactionData: Record<ReactionType, { count: number; users: any[] }> = {
      like: { count: 0, users: [] },
      love: { count: 0, users: [] },
      haha: { count: 0, users: [] },
      wow: { count: 0, users: [] },
      sad: { count: 0, users: [] },
      angry: { count: 0, users: [] },
    }

    // Count reactions by type and collect user information
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((reaction: any) => {
        const type = (reaction.attributes?.type || reaction.type) as ReactionType
        const userData = reaction.attributes?.user?.data?.attributes || reaction.user

        if (type && reactionData[type] !== undefined) {
          reactionData[type].count++

          if (userData) {
            const user = {
              id: reaction.attributes?.user?.data?.id || reaction.user?.id,
              username: userData.username || "user",
              displayName: userData.displayName || userData.username,
              avatar: userData.avatar?.data?.attributes?.url || userData.profileImage?.url || null,
            }
            reactionData[type].users.push(user)
          }
        }
      })
    }

    return reactionData
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
}
