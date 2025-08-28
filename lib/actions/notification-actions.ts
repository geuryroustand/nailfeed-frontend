"use server"

import {
  createNotification,
  sendPushNotification,
  getUserPushSubscriptions,
  savePushSubscription,
  type NotificationData,
  type PushSubscription,
} from "@/lib/services/notification-service"
import { revalidatePath } from "next/cache"

/**
 * Server action to create and send comment notification
 */
export async function createCommentNotification(
  postId: string,
  postAuthorId: string,
  commentAuthorId: string,
  commentAuthorName: string,
  commentContent: string,
) {
  try {
    // Don't send notification if user is commenting on their own post
    if (postAuthorId === commentAuthorId) {
      return { success: true, message: "No notification needed for own post" }
    }

    // Create notification in database
    const notificationData: NotificationData = {
      type: "comment",
      userId: postAuthorId,
      relatedUserId: commentAuthorId,
      relatedPostId: postId,
      message: `${commentAuthorName} commented on your post`,
      title: "New Comment",
    }

    await createNotification(notificationData)

    // Get user's push subscriptions
    const subscriptions = await getUserPushSubscriptions(postAuthorId)

    // Send push notifications to all user's devices
    const pushPromises = subscriptions.map(async (sub: any) => {
      const subscription: PushSubscription = {
        endpoint: sub.attributes.endpoint,
        keys: {
          p256dh: sub.attributes.p256dh,
          auth: sub.attributes.auth,
        },
      }

      return sendPushNotification(subscription, {
        title: "New Comment on Your Post",
        body: `${commentAuthorName}: ${commentContent.substring(0, 100)}${commentContent.length > 100 ? "..." : ""}`,
        icon: "/icon-192x192.png",
        data: {
          type: "comment",
          postId,
          url: `/post/${postId}`,
        },
      })
    })

    await Promise.all(pushPromises)

    // Revalidate relevant paths
    revalidatePath("/notifications")
    revalidatePath(`/post/${postId}`)

    return { success: true, message: "Comment notification sent" }
  } catch (error) {
    console.error("Error creating comment notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    }
  }
}

/**
 * Server action to subscribe to push notifications
 */
export async function subscribeToPushNotifications(userId: string, subscription: PushSubscription) {
  try {
    await savePushSubscription(userId, subscription)
    return { success: true, message: "Successfully subscribed to notifications" }
  } catch (error) {
    console.error("Error subscribing to push notifications:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe",
    }
  }
}

/**
 * Server action to get user notifications
 */
export async function getUserNotifications(userId: string, page = 1, pageSize = 20) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
    const url = `${API_BASE_URL}/api/notifications?filters[user][id][$eq]=${userId}&sort=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        "Content-Type": "application/json",
      },
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
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
    const url = `${API_BASE_URL}/api/notifications/${notificationId}`

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        "Content-Type": "application/json",
      },
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
