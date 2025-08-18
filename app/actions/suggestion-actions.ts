"use server"

import { revalidatePath } from "next/cache"
import { getApiUrl } from "@/lib/api-helpers"
import { getCurrentUser } from "@/app/actions/auth-actions"

const API_URL = getApiUrl()
const API_TOKEN = process.env.API_TOKEN || ""

export interface Suggestion {
  id: number
  documentId: string
  title: string
  description: string
  votes: number
  status: "in-review" | "planned" | "in-development" | "released"
  createdAt: string
  updatedAt: string
  publishedAt: string
  user: {
    id: number
    username: string
    email: string
  }
  suggestion_votes: Array<{
    id: number
    user: {
      id: number
      username: string
    }
  }>
  voteCount?: number
  userHasVoted?: boolean
  isCreator?: boolean
}

async function getVoteCounts(
  userId?: number,
): Promise<{ [suggestionId: string]: { count: number; userHasVoted: boolean } }> {
  try {
    console.log("[v0] Fetching vote counts from suggestion-votes endpoint")
    console.log("[v0] Current userId for vote checking:", userId)

    const response = await fetch(`${API_URL}/api/suggestion-votes?populate[0]=suggestion&populate[1]=user`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.error("Failed to fetch vote counts:", response.status, response.statusText)
      return {}
    }

    const data = await response.json()
    const voteCounts: { [suggestionId: string]: { count: number; userHasVoted: boolean } } = {}

    console.log("[v0] Raw vote data:", JSON.stringify(data.data, null, 2))

    // Group votes by suggestion
    data.data?.forEach((vote: any) => {
      const suggestionId = vote.suggestion?.documentId
      if (suggestionId) {
        if (!voteCounts[suggestionId]) {
          voteCounts[suggestionId] = { count: 0, userHasVoted: false }
        }
        voteCounts[suggestionId].count++

        console.log("[v0] Checking vote - Vote user ID:", vote.user?.id, "Current user ID:", userId)

        // Check if current user has voted
        if (userId && vote.user?.id === userId) {
          voteCounts[suggestionId].userHasVoted = true
          console.log("[v0] User has voted on suggestion:", suggestionId)
        }
      }
    })

    console.log("[v0] Vote counts processed:", Object.keys(voteCounts).length, "suggestions have votes")
    console.log("[v0] Final vote counts:", JSON.stringify(voteCounts, null, 2))
    return voteCounts
  } catch (error) {
    console.error("Error fetching vote counts:", error)
    return {}
  }
}

export async function createSuggestion(formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!title || !description) {
      return { success: false, error: "Title and description are required" }
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "You must be logged in to create a suggestion" }
    }

    console.log("[v0] Creating suggestion for user:", currentUser.id, currentUser.username)

    const response = await fetch(`${API_URL}/api/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          title,
          description,
          votes: 0,
          status: "in-review",
          user: {
            connect: [currentUser.documentId || currentUser.id],
          },
        },
      }),
    })

    if (!response.ok) {
      console.error("Failed to create suggestion:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Error response body:", errorText)
      throw new Error(`Request failed with status ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Successfully created suggestion:", result.data?.documentId)
    revalidatePath("/suggestions")
    return { success: true, data: result.data }
  } catch (error) {
    console.error("Error creating suggestion:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create suggestion",
    }
  }
}

export async function voteSuggestion(suggestionId: string, action: "vote" | "unvote") {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "You must be logged in to vote" }
    }

    const userId = currentUser.id
    console.log("[v0] Vote action:", action, "for suggestion:", suggestionId, "by user:", userId)

    if (action === "vote") {
      const response = await fetch(`${API_URL}/api/suggestion-votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            suggestion: {
              connect: [suggestionId],
            },
            user: {
              connect: [currentUser.documentId || currentUser.id],
            },
          },
        }),
      })

      if (!response.ok) {
        console.error("Failed to vote:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Vote error response body:", errorText)
        throw new Error(`Vote failed with status ${response.status}: ${errorText}`)
      }
    } else {
      const votesResponse = await fetch(
        `${API_URL}/api/suggestion-votes?filters[suggestion][documentId][$eq]=${suggestionId}&filters[user][id][$eq]=${userId}&populate=*`,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          },
        },
      )

      if (votesResponse.ok) {
        const votesData = await votesResponse.json()
        if (votesData.data.length > 0) {
          const voteId = votesData.data[0].documentId
          const deleteResponse = await fetch(`${API_URL}/api/suggestion-votes/${voteId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${API_TOKEN}`,
            },
          })

          if (!deleteResponse.ok) {
            console.error("Failed to delete vote:", deleteResponse.status, deleteResponse.statusText)
            const errorText = await deleteResponse.text()
            console.error("Delete vote error response body:", errorText)
            throw new Error(`Delete vote failed with status ${deleteResponse.status}: ${errorText}`)
          }
        }
      }
    }

    revalidatePath("/suggestions")
    return { success: true }
  } catch (error) {
    console.error("Error voting on suggestion:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to vote on suggestion",
    }
  }
}

export async function updateSuggestion(suggestionId: string, formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!title || !description) {
      return { success: false, error: "Title and description are required" }
    }

    let currentUser
    try {
      currentUser = await getCurrentUser()
    } catch (error) {
      console.error("[v0] Auth error during update:", error)
      return { success: false, error: "Authentication failed. Please try logging in again." }
    }

    if (!currentUser) {
      return { success: false, error: "You must be logged in to update suggestions" }
    }

    console.log("[v0] Updating suggestion:", suggestionId, "by user:", currentUser.id)

    const response = await fetch(`${API_URL}/api/suggestions/${suggestionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          title,
          description,
        },
      }),
    })

    if (!response.ok) {
      console.error("Failed to update suggestion:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Error response body:", errorText)
      throw new Error(`Request failed with status ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] Successfully updated suggestion:", result.data?.documentId)

    revalidatePath("/suggestions")

    return { success: true, data: result.data }
  } catch (error) {
    console.error("Error updating suggestion:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update suggestion",
    }
  }
}

export async function getSuggestions(userId?: number): Promise<Suggestion[]> {
  try {
    console.log("[v0] Fetching suggestions from:", `${API_URL}/api/suggestions`)

    let currentUserId: number | undefined = userId

    try {
      const currentUser = await getCurrentUser()
      currentUserId = currentUser?.id || userId
      console.log("[v0] Successfully got current user ID:", currentUserId)
    } catch (error) {
      console.warn("[v0] Failed to get current user, continuing without auth:", error)
      // Continue without user context - suggestions will still load
    }

    const response = await fetch(`${API_URL}/api/suggestions?populate[0]=user&sort=createdAt:desc`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      next: { revalidate: 60 },
    })

    console.log("[v0] Response status:", response.status)

    if (!response.ok) {
      console.error("Failed to fetch suggestions:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Error response body:", errorText)
      return []
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Response is not JSON, content-type:", contentType)
      return []
    }

    const data = await response.json()
    console.log("[v0] Successfully fetched suggestions:", data.data?.length || 0, "items")

    const voteCounts = await getVoteCounts(currentUserId)

    const suggestionsWithVotes = (data.data || []).map((suggestion: any) => {
      const voteData = voteCounts[suggestion.documentId] || { count: 0, userHasVoted: false }
      return {
        ...suggestion,
        voteCount: voteData.count,
        userHasVoted: currentUserId ? voteData.userHasVoted : false,
        isCreator: currentUserId ? suggestion.user?.id === currentUserId : false,
        suggestion_votes: Array(voteData.count).fill({ id: 0, user: { id: 0, username: "" } }),
      }
    })

    suggestionsWithVotes.sort((a: any, b: any) => (b.voteCount || 0) - (a.voteCount || 0))

    console.log("[v0] Suggestions with vote counts:", suggestionsWithVotes.length, "items processed")
    if (suggestionsWithVotes.length > 0) {
      console.log("[v0] First suggestion vote data:")
      console.log("[v0] - voteCount:", suggestionsWithVotes[0].voteCount)
      console.log("[v0] - userHasVoted:", suggestionsWithVotes[0].userHasVoted)
      console.log("[v0] - isCreator:", suggestionsWithVotes[0].isCreator)
    }

    return suggestionsWithVotes
  } catch (error) {
    console.error("Error fetching suggestions:", error)
    return []
  }
}
