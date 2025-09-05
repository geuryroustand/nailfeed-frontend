import webpush from "web-push"

const API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:support@nailfeed.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

export interface PushSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  isActive: boolean
  user: {
    id: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  url: string
  icon?: string
  badge?: string
}

/**
 * Fetch active push subscriptions for a specific user from Strapi
 */
export async function getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/push-subscriptions?filters[user][id][$eq]=${userId}&filters[isActive][$eq]=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      console.error(`Failed to fetch push subscriptions: ${response.status}`)
      return []
    }

    const data = await response.json()

    if (data.data && Array.isArray(data.data)) {
      return data.data.map((sub: any) => ({
        id: sub.id.toString(),
        endpoint: sub.attributes?.endpoint || sub.endpoint,
        p256dh: sub.attributes?.p256dh || sub.p256dh,
        auth: sub.attributes?.auth || sub.auth,
        isActive: sub.attributes?.isActive ?? sub.isActive ?? true,
        user: {
          id: sub.attributes?.user?.data?.id || sub.user?.id || userId,
        },
      }))
    }

    return []
  } catch (error) {
    console.error("Error fetching push subscriptions:", error)
    return []
  }
}

/**
 * Send web push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
): Promise<{ success: boolean; shouldCleanup: boolean }> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/icon-192x192.png",
      data: {
        url: payload.url,
      },
    })

    await webpush.sendNotification(pushSubscription, notificationPayload)
    console.log(`[v0] Push notification sent successfully to subscription ${subscription.id}`)

    return { success: true, shouldCleanup: false }
  } catch (error: any) {
    console.error(`[v0] Failed to send push notification to subscription ${subscription.id}:`, error)

    // Check if we should cleanup this subscription (404/410 errors)
    const shouldCleanup =
      error.statusCode === 404 ||
      error.statusCode === 410 ||
      error.code === "InvalidRegistration" ||
      error.code === "NotRegistered"

    return { success: false, shouldCleanup }
  }
}

/**
 * Mark a push subscription as inactive or delete it from Strapi
 */
export async function cleanupPushSubscription(subscriptionId: string): Promise<void> {
  try {
    // Delete the subscription from Strapi
    const response = await fetch(`${API_URL}/api/push-subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    })

    if (!response.ok) {
      console.error(`Failed to delete push subscription ${subscriptionId}: ${response.status}`)
    } else {
      console.log(`[v0] Cleaned up invalid push subscription ${subscriptionId}`)
    }
  } catch (error) {
    console.error(`Error cleaning up push subscription ${subscriptionId}:`, error)
  }
}

/**
 * Send push notifications to all active subscriptions for a user
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload,
): Promise<{ sent: number; failed: number; cleaned: number }> {
  const subscriptions = await getUserPushSubscriptions(userId)

  if (subscriptions.length === 0) {
    console.log(`[v0] No active push subscriptions found for user ${userId}`)
    return { sent: 0, failed: 0, cleaned: 0 }
  }

  console.log(`[v0] Sending push notifications to ${subscriptions.length} devices for user ${userId}`)

  let sent = 0
  let failed = 0
  let cleaned = 0

  // Send notifications to all subscriptions
  const promises = subscriptions.map(async (subscription) => {
    const result = await sendPushNotification(subscription, payload)

    if (result.success) {
      sent++
    } else {
      failed++

      if (result.shouldCleanup) {
        await cleanupPushSubscription(subscription.id)
        cleaned++
      }
    }
  })

  await Promise.all(promises)

  console.log(`[v0] Push notification results for user ${userId}: ${sent} sent, ${failed} failed, ${cleaned} cleaned`)

  return { sent, failed, cleaned }
}

/**
 * Get post author information from Strapi
 */
export async function getPostAuthor(postId: string | number): Promise<{ id: string; username: string } | null> {
  try {
    const response = await fetch(`${API_URL}/api/posts/${postId}?populate=user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch post author: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.data?.attributes?.user?.data) {
      const user = data.data.attributes.user.data
      return {
        id: user.id.toString(),
        username: user.attributes?.username || "user",
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching post author:", error)
    return null
  }
}
