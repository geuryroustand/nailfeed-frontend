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
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  const cookieStore = cookies()
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
    const headers = getAuthHeaders()

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
 * Server action to save push subscription to Strapi
 * Store push subscription data in notifications with special type
 */
export async function subscribeToPushNotifications(userId: string, subscription: PushSubscription) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/push-subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server",
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to save push subscription: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, message: "Successfully subscribed to notifications", data: data.data }
  } catch (error) {
    console.error("Error subscribing to push notifications:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe",
    }
  }
}

/**
 * Server action to get user's push subscriptions from Strapi
 * Retrieve push subscriptions from notifications with special type
 */
export async function getUserPushSubscriptions(userId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/push-subscriptions?userId=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to get push subscriptions: ${response.status}`)
    }

    const result = await response.json()

    return (
      result.data?.map((item: any) => ({
        id: item.id,
        attributes: {
          endpoint: item.attributes.endpoint,
          p256dh: item.attributes.p256dh,
          auth: item.attributes.auth,
          userAgent: item.attributes.userAgent,
          isActive: item.attributes.isActive,
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

    return { success: true, message: "Comment notification created (no push notification sent)" }
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

    return { success: true, message: "Reaction notification created (no push notification sent)" }
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
    const headers = getAuthHeaders()

    const response = await fetch(url, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data: data.data, pagination: data.meta?.pagination }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch notifications" }
  }
}

/**
 * Server action to mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const url = `${API_BASE_URL}/api/notifications/${notificationId}`
    const headers = getAuthHeaders()

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
    return { success: false, error: error instanceof Error ? error.message : "Failed to mark as read" }
  }
}
