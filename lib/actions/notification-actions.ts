"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
const SERVER_API_TOKEN = process.env.API_TOKEN || ""

export interface NotificationData {
  type: "like" | "comment" | "follow" | "mention" | "collection" | "mood" | "push_subscription"
  userId: string
  relatedUserId?: string
  relatedPostId?: string
  relatedCommentId?: string
  message: string
  title: string
  metadata?: PushSubscription
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
 * Server action to create a notification in Strapi
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
          metadata: data.metadata,
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
    const url = `${API_BASE_URL}/api/notifications`
    const headers = getAuthHeaders()

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          type: "push_subscription", // Use the correct enum value we added to Strapi
          read: true, // Mark as read since it's not a user-facing notification
          user: userId,
          metadata: subscription, // Store subscription data in metadata field
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Strapi error response:", errorText)
      throw new Error(`Failed to save push subscription: ${response.status} - ${errorText}`)
    }

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
 * Server action to get user's push subscriptions from Strapi
 * Retrieve push subscriptions from notifications with special type
 */
export async function getUserPushSubscriptions(userId: string) {
  try {
    console.log("[v0] getUserPushSubscriptions (server action) - Fetching for user:", userId)

    const url = `${API_BASE_URL}/api/notifications?filters[user][id][$eq]=${userId}&filters[type][$eq]=push_subscription`
    const headers = getAuthHeaders()

    console.log("[v0] getUserPushSubscriptions (server action) - API URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      console.error("[v0] getUserPushSubscriptions (server action) - API error:", response.status, response.statusText)
      throw new Error(`Failed to get push subscriptions: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] getUserPushSubscriptions (server action) - Raw API response:", data)

    const subscriptions =
      data.data
        ?.map((item: any) => {
          const subscriptionData = item.attributes?.metadata || item.metadata
          console.log("[v0] getUserPushSubscriptions (server action) - Processing subscription:", subscriptionData)

          return {
            id: item.id,
            attributes: {
              endpoint: subscriptionData?.endpoint,
              p256dh: subscriptionData?.keys?.p256dh,
              auth: subscriptionData?.keys?.auth,
            },
          }
        })
        .filter((sub: any) => sub.attributes.endpoint) || []

    console.log("[v0] getUserPushSubscriptions (server action) - Processed subscriptions:", subscriptions)
    return subscriptions
  } catch (error) {
    console.error("[v0] getUserPushSubscriptions (server action) - Error:", error)
    return []
  }
}

/**
 * Server action to send push notification
 * Move push notification sending logic to server action
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string
    body: string
    icon?: string
    badge?: string
    data?: any
  },
) {
  try {
    console.log("[v0] sendPushNotification - Starting with subscription:", {
      endpoint: subscription.endpoint,
      hasKeys: !!(subscription.keys?.p256dh && subscription.keys?.auth),
    })
    console.log("[v0] sendPushNotification - Payload:", payload)

    const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@nailfeed.com"
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

    console.log("[v0] sendPushNotification - VAPID config:", {
      hasSubject: !!vapidSubject,
      hasPublicKey: !!vapidPublicKey,
      hasPrivateKey: !!vapidPrivateKey,
      subject: vapidSubject,
    })

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("[v0] sendPushNotification - Missing VAPID keys")
      return { success: false, error: "VAPID keys not configured" }
    }

    const webpush = await import("web-push")

    // Configure web-push with VAPID keys
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/icon-192x192.png",
      data: payload.data || {},
      actions: [
        {
          action: "view",
          title: "View",
          icon: "/icon-192x192.png",
        },
      ],
    })

    console.log("[v0] sendPushNotification - Sending notification with payload:", notificationPayload)

    await webpush.sendNotification(subscription, notificationPayload)
    console.log("[v0] sendPushNotification - Successfully sent notification")
    return { success: true }
  } catch (error) {
    console.error("[v0] sendPushNotification - Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

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
 * Server action to create and send reaction notification
 */
export async function createReactionNotification(
  postId: string,
  postAuthorId: string,
  reactionAuthorId: string,
  reactionAuthorName: string,
  reactionType: string,
) {
  try {
    console.log("[v0] createReactionNotification called with:", {
      postId,
      postAuthorId,
      reactionAuthorId,
      reactionAuthorName,
      reactionType,
    })

    // Don't send notification if user is reacting to their own post
    if (postAuthorId === reactionAuthorId) {
      console.log("[v0] Skipping notification - user reacting to own post")
      return { success: true, message: "No notification needed for own post" }
    }

    // Create notification in database
    const notificationData: NotificationData = {
      type: "like", // Use "like" type for all reactions since it's in the Strapi enum
      userId: postAuthorId,
      relatedUserId: reactionAuthorId,
      relatedPostId: postId,
      message: `${reactionAuthorName} reacted to your post with ${reactionType}`,
      title: "New Reaction",
    }

    console.log("[v0] Creating notification in database:", notificationData)
    await createNotification(notificationData)

    // Get user's push subscriptions
    console.log("[v0] Getting push subscriptions for user:", postAuthorId)
    const subscriptions = await getUserPushSubscriptions(postAuthorId)
    console.log("[v0] Found push subscriptions:", subscriptions.length)

    if (subscriptions.length === 0) {
      console.log("[v0] No push subscriptions found for user")
      return { success: true, message: "Notification created but no push subscriptions found" }
    }

    // Send push notifications to all user's devices
    const pushPromises = subscriptions.map(async (sub: any) => {
      const subscription: PushSubscription = {
        endpoint: sub.attributes.endpoint,
        keys: {
          p256dh: sub.attributes.p256dh,
          auth: sub.attributes.auth,
        },
      }

      console.log("[v0] Sending push notification to:", subscription.endpoint)
      return sendPushNotification(subscription, {
        title: "New Reaction on Your Post",
        body: `${reactionAuthorName} reacted with ${reactionType} to your post`,
        icon: "/icon-192x192.png",
        data: {
          type: "reaction",
          postId,
          url: `/post/${postId}`,
        },
      })
    })

    const results = await Promise.all(pushPromises)
    console.log("[v0] Push notification results:", results)

    // Revalidate relevant paths
    revalidatePath("/notifications")
    revalidatePath(`/post/${postId}`)

    return { success: true, message: "Reaction notification sent" }
  } catch (error) {
    console.error("[v0] Error creating reaction notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    }
  }
}

/**
 * Server action to get user notifications
 */
export async function getUserNotifications(userId: string, page = 1, pageSize = 20) {
  try {
    const url = `${API_BASE_URL}/api/notifications?filters[user][id][$eq]=${userId}&filters[type][$ne]=push_subscription&sort=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`
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
