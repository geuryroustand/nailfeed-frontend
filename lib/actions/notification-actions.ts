"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
const SERVER_API_TOKEN = process.env.API_TOKEN || ""

export interface NotificationData {
  type: "like" | "comment" | "follow" | "mention" | "collection" | "mood"
  userId: string
  relatedUserId?: string
  relatedPostId?: string
  relatedCommentId?: string
  message: string
  title: string
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Get authentication headers for Strapi requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  const cookieStore = await cookies()
  const jwt = cookieStore.get("jwt")?.value
  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`
  } else if (SERVER_API_TOKEN) {
    headers["Authorization"] = `Bearer ${SERVER_API_TOKEN}`
  }

  return headers
}

/**
 * Server action to create a notification in Strapi (without sending push notification)
 */
export async function createNotification(data: NotificationData) {
  try {
    const url = `${API_BASE_URL}/api/notifications`
    const headers = await getAuthHeaders()

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          type: data.type,
          read: false,
          user: data.userId,
          relatedUser: data.relatedUserId,
          relatedPost: data.relatedPostId,
          relatedComment: data.relatedCommentId,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

/**
 * Server action to save push subscription directly to Strapi
 */
export async function subscribeToPushNotifications(userIdentifier: string, subscription: PushSubscription) {
  try {
    const headers = await getAuthHeaders()

    // First check if subscription already exists
    const existingResponse = await fetch(
      `${API_BASE_URL}/api/push-subscriptions?filters[endpoint][$eq]=${encodeURIComponent(subscription.endpoint)}`,
      {
        method: "GET",
        headers,
      },
    )

    if (existingResponse.ok) {
      const existingData = await existingResponse.json()
      if (existingData.data && existingData.data.length > 0) {
        return {
          success: true,
          message: "Subscription already exists",
          data: existingData.data[0],
        }
      }
    }

    // Determine if userIdentifier is a documentId (string) or regular ID (number)
    const isDocumentId = isNaN(Number(userIdentifier)) || userIdentifier.length > 10

    let userRelation
    if (isDocumentId) {
      // Use documentId for Strapi v5 relation syntax
      userRelation = { connect: [{ documentId: userIdentifier }] }
    } else {
      // Use regular ID for Strapi v5 relation syntax
      userRelation = { connect: [{ id: Number.parseInt(userIdentifier) }] }
    }

    // Create new subscription with proper Strapi v5 relation syntax
    const response = await fetch(`${API_BASE_URL}/api/push-subscriptions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server",
          isActive: true,
          user: userRelation,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Full error response:", JSON.stringify(errorData, null, 2))

      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        errorData.error ||
        `Failed to save push subscription: ${response.status}`

      throw new Error(errorMessage)
    }

    const data = await response.json()
    return {
      success: true,
      message: "Successfully subscribed to notifications",
      data: data.data,
    }
  } catch (error) {
    console.error("Error subscribing to push notifications:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe",
    }
  }
}

/**
 * Server action to get user's push subscriptions directly from Strapi
 */
export async function getUserPushSubscriptions(userIdentifier: string) {
  try {
    const headers = await getAuthHeaders()

    // Determine if userIdentifier is a documentId (string) or regular ID (number)
    const isDocumentId = isNaN(Number(userIdentifier)) || userIdentifier.length > 10

    let filterQuery
    if (isDocumentId) {
      filterQuery = `filters[user][documentId][$eq]=${userIdentifier}`
    } else {
      filterQuery = `filters[user][id][$eq]=${userIdentifier}`
    }

    const response = await fetch(`${API_BASE_URL}/api/push-subscriptions?${filterQuery}&populate=user`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to get push subscriptions: ${response.status}`)
    }

    const result = await response.json()

    return (
      result.data?.map((item: any) => ({
        id: item.id,
        documentId: item.documentId,
        attributes: {
          endpoint: item.endpoint,
          p256dh: item.p256dh,
          auth: item.auth,
          userAgent: item.userAgent,
          isActive: item.isActive,
        },
      })) || []
    )
  } catch (error) {
    console.error("Error getting push subscriptions:", error)
    return []
  }
}

/**
 * Server action to create comment notification (without sending push notification)
 */
export async function createCommentNotification(
  postId: string,
  postAuthorId: string,
  commentAuthorId: string,
  commentAuthorName: string,
  commentContent: string,
) {
  try {
    // Don't create notification if user is commenting on their own post
    if (postAuthorId === commentAuthorId) {
      return { success: true, message: "No notification needed for own post" }
    }

    // Create notification in database only (no push notification)
    const notificationData: NotificationData = {
      type: "comment",
      userId: postAuthorId,
      relatedUserId: commentAuthorId,
      relatedPostId: postId,
      message: `${commentAuthorName} commented on your post`,
      title: "New Comment",
    }

    await createNotification(notificationData)

    // Revalidate relevant paths
    revalidatePath("/notifications")
    revalidatePath(`/post/${postId}`)

    return {
      success: true,
      message: "Comment notification created (no push notification sent)",
    }
  } catch (error) {
    console.error("Error creating comment notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    }
  }
}

/**
 * Server action to create reaction notification (without sending push notification)
 */
export async function createReactionNotification(
  postId: string,
  postAuthorId: string,
  reactionAuthorId: string,
  reactionAuthorName: string,
  reactionType: string,
) {
  try {
    // Don't create notification if user is reacting to their own post
    if (postAuthorId === reactionAuthorId) {
      return { success: true, message: "No notification needed for own post" }
    }

    // Create notification in database only (no push notification)
    const notificationData: NotificationData = {
      type: "like", // Use "like" type for all reactions since it's in the Strapi enum
      userId: postAuthorId,
      relatedUserId: reactionAuthorId,
      relatedPostId: postId,
      message: `${reactionAuthorName} reacted to your post with ${reactionType}`,
      title: "New Reaction",
    }

    await createNotification(notificationData)

    // Revalidate relevant paths
    revalidatePath("/notifications")
    revalidatePath(`/post/${postId}`)

    return {
      success: true,
      message: "Reaction notification created (no push notification sent)",
    }
  } catch (error) {
    console.error("Error creating reaction notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    }
  }
}

/**
 * Server action to get user notifications
 */
export async function getUserNotifications(userId: string, page = 1, pageSize = 20) {
  try {
    const url = `${API_BASE_URL}/api/notifications?filters[user][id][$eq]=${userId}&sort=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`
    const headers = await getAuthHeaders()

    const response = await fetch(url, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data,
      pagination: data.meta?.pagination,
    }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch notifications",
    }
  }
}

/**
 * Server action to mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const url = `${API_BASE_URL}/api/notifications/${notificationId}`
    const headers = await getAuthHeaders()

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        data: { read: true },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.status}`)
    }

    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark as read",
    }
  }
}
