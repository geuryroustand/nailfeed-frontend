"use server"

import { cookies } from "next/headers"

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
 * Create a notification in Strapi
 */
export async function createNotification(data: NotificationData) {
  try {
    const url = `${API_BASE_URL}/api/notifications`

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
 * Send push notification to user
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
    const webpush = await import("web-push")

    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:support@nailfeed.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )

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

    await webpush.sendNotification(subscription, notificationPayload)
    return { success: true }
  } catch (error) {
    console.error("Error sending push notification:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Get user's push subscriptions from database
 */
export async function getUserPushSubscriptions(userId: string) {
  try {
    const url = `${API_BASE_URL}/api/notifications?filters[user][id][$eq]=${userId}&filters[type][$eq]=push_subscription`
    const headers = getAuthHeaders()

    console.log("[v0] getUserPushSubscriptions - Fetching subscriptions for user:", userId)
    console.log("[v0] getUserPushSubscriptions - API URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      console.error("[v0] getUserPushSubscriptions - API error:", response.status, response.statusText)
      throw new Error(`Failed to get push subscriptions: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] getUserPushSubscriptions - Raw API response:", data)

    const subscriptions =
      data.data
        ?.map((item: any) => {
          const subscriptionData = item.attributes?.metadata || item.metadata
          console.log("[v0] getUserPushSubscriptions - Processing subscription:", subscriptionData)

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

    console.log("[v0] getUserPushSubscriptions - Processed subscriptions:", subscriptions)
    return subscriptions
  } catch (error) {
    console.error("[v0] getUserPushSubscriptions - Error:", error)
    return []
  }
}

/**
 * Save push subscription to database
 */
export async function savePushSubscription(userId: string, subscription: PushSubscription) {
  try {
    const url = `${API_BASE_URL}/api/push-subscriptions`

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

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          user: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save push subscription: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error saving push subscription:", error)
    throw error
  }
}

function getAuthHeaders() {
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
