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
 * Helper function to get emoji label for reaction type
 */
function getReactionEmojiLabel(reactionType: string): string {
  const emojiMap: Record<string, string> = {
    like: "👍",
    love: "❤️",
    haha: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  }
  return emojiMap[reactionType] || "👍"
}

/**
 * Helper function to truncate content for notifications
 */
function truncateContent(content: string, maxLength = 90): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength).trim() + "..."
}

/**
 * Server action to create comment notification (without sending push notification)
 */
export async function createCommentNotificationWithoutPush(
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
 * Server action to create comment notification WITH push notification sending
 */
export async function createCommentNotification(
  postId: string,
  postAuthorId: string,
  commentAuthorId: string,
  commentAuthorName: string,
  commentContent: string,
) {
  try {
    console.log("[v0] Creating comment notification:", {
      postId,
      postAuthorId,
      commentAuthorId,
      commentAuthorName,
    })

    // Don't create notification if user is commenting on their own post
    if (postAuthorId === commentAuthorId) {
      console.log("[v0] Skipping notification - user commenting on own post")
      return { success: true, message: "No notification needed for own post" }
    }

    const truncatedContent = truncateContent(commentContent)

    // Create notification in database
    const notificationData: NotificationData = {
      type: "comment",
      userId: postAuthorId,
      relatedUserId: commentAuthorId,
      relatedPostId: postId,
      message: `${commentAuthorName} commented: "${truncatedContent}"`,
      title: "New comment on your post 💬",
    }

    console.log("[v0] Creating comment notification in database...")
    await createNotification(notificationData)

    console.log("[v0] Fetching push subscriptions for post author:", postAuthorId)
    const subscriptions = await getUserPushSubscriptions(postAuthorId)
    console.log("[v0] Found", subscriptions.length, "push subscriptions")

    if (subscriptions.length > 0) {
      console.log("[v0] Active subscriptions found, sending push notifications...")
      const pushPayload = {
        title: "New comment on your post 💬",
        body: `${commentAuthorName} commented: "${truncatedContent}"`,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: {
          postId,
          type: "comment",
          url: `/post/${postId}`,
        },
      }

      // Send push notifications to all active subscriptions
      const pushResults = await Promise.allSettled(
        subscriptions
          .filter((sub) => sub.attributes.isActive)
          .map((sub) =>
            sendPushNotification(
              {
                id: sub.id,
                endpoint: sub.attributes.endpoint,
                p256dh: sub.attributes.p256dh,
                auth: sub.attributes.auth,
              },
              pushPayload,
            ),
          ),
      )

      const successCount = pushResults.filter((result) => result.status === "fulfilled" && result.value.success).length
      console.log("[v0] Push notifications sent:", successCount, "of", subscriptions.length)
    } else {
      console.log("[v0] ⚠️  No push subscriptions found for post author", postAuthorId)
      console.log("[v0] 💡 The post author needs to enable notifications to receive push notifications")
    }

    // Revalidate relevant paths
    revalidatePath("/notifications")
    revalidatePath(`/post/${postId}`)

    return {
      success: true,
      message:
        subscriptions.length > 0
          ? "Comment notification created and push notifications sent"
          : "Comment notification created (post author has no active push subscriptions)",
    }
  } catch (error) {
    console.error("[v0] Error creating comment notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    }
  }
}

/**
 * Server action to create reaction notification (without sending push notification)
 */
export async function createReactionNotificationWithoutPush(
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

    const emojiLabel = getReactionEmojiLabel(reactionType)

    // Create notification in database only (no push notification)
    const notificationData: NotificationData = {
      type: "like", // Use "like" type for all reactions since it's in the Strapi enum
      userId: postAuthorId,
      relatedUserId: reactionAuthorId,
      relatedPostId: postId,
      message: `${reactionAuthorName} reacted ${emojiLabel} to your post. Open to see it.`,
      title: `New reaction from ${reactionAuthorName} 💅`,
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
 * Server action to create reaction notification WITH push notification sending
 */
export async function createReactionNotification(
  postId: string,
  postAuthorId: string,
  reactionAuthorId: string,
  reactionAuthorName: string,
  reactionType: string,
) {
  try {
    console.log("[v0] Creating reaction notification:", {
      postId,
      postAuthorId,
      reactionAuthorId,
      reactionAuthorName,
      reactionType,
    })

    // Don't create notification if user is reacting to their own post
    if (postAuthorId === reactionAuthorId) {
      console.log("[v0] Skipping notification - user reacting to own post")
      return { success: true, message: "No notification needed for own post" }
    }

    const emojiLabel = getReactionEmojiLabel(reactionType)

    // Create notification in database
    const notificationData: NotificationData = {
      type: "like", // Use "like" type for all reactions since it's in the Strapi enum
      userId: postAuthorId,
      relatedUserId: reactionAuthorId,
      relatedPostId: postId,
      message: `${reactionAuthorName} reacted ${emojiLabel} to your post. Open to see it.`,
      title: `New reaction from ${reactionAuthorName} 💅`,
    }

    console.log("[v0] Creating notification in database...")
    await createNotification(notificationData)

    console.log("[v0] Fetching push subscriptions for user:", postAuthorId)
    const subscriptions = await getUserPushSubscriptions(postAuthorId)
    console.log("[v0] Found", subscriptions.length, "push subscriptions")

    if (subscriptions.length > 0) {
      console.log("[v0] Active subscriptions found, sending push notifications...")
      const pushPayload = {
        title: `New reaction from ${reactionAuthorName} 💅`,
        body: `${reactionAuthorName} reacted ${emojiLabel} to your post. Open to see it.`,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: {
          postId,
          type: "reaction",
          url: `/post/${postId}`,
        },
      }

      // Send push notifications to all active subscriptions
      const pushResults = await Promise.allSettled(
        subscriptions
          .filter((sub) => sub.attributes.isActive)
          .map((sub) =>
            sendPushNotification(
              {
                id: sub.id,
                endpoint: sub.attributes.endpoint,
                p256dh: sub.attributes.p256dh,
                auth: sub.attributes.auth,
              },
              pushPayload,
            ),
          ),
      )

      const successCount = pushResults.filter((result) => result.status === "fulfilled" && result.value.success).length

      console.log("[v0] Push notifications sent:", successCount, "of", subscriptions.length)
    } else {
      console.log("[v0] ⚠️  No push subscriptions found for user", postAuthorId)
      console.log(
        "[v0] 💡 The post author needs to enable notifications in their browser to receive push notifications",
      )
      console.log("[v0] 📱 They can do this by clicking 'Enable' on the notification permission prompt")
    }

    // Revalidate relevant paths
    revalidatePath("/notifications")
    revalidatePath(`/post/${postId}`)

    return {
      success: true,
      message:
        subscriptions.length > 0
          ? "Reaction notification created and push notifications sent"
          : "Reaction notification created (post author has no active push subscriptions)",
    }
  } catch (error) {
    console.error("[v0] Error creating reaction notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    }
  }
}

/**
 * Server action to create reply notification WITH push notification sending
 */
export async function createReplyNotification(
  postId: string,
  parentCommentId: string,
  commentAuthorId: string, // Author of the parent comment (who should receive notification)
  replyAuthorId: string, // Author of the reply
  replyAuthorName: string,
  replyContent: string,
) {
  try {
    console.log("[v0] Creating reply notification:", {
      postId,
      parentCommentId,
      commentAuthorId,
      replyAuthorId,
      replyAuthorName,
    })

    // Don't create notification if user is replying to their own comment
    if (commentAuthorId === replyAuthorId) {
      console.log("[v0] Skipping notification - user replying to own comment")
      return { success: true, message: "No notification needed for own comment" }
    }

    const truncatedContent = truncateContent(replyContent)

    // Create notification in database
    const notificationData: NotificationData = {
      type: "comment", // Use comment type for replies as well
      userId: commentAuthorId, // Notify the comment author, not the post author
      relatedUserId: replyAuthorId,
      relatedPostId: postId,
      relatedCommentId: parentCommentId,
      message: `${replyAuthorName} replied: "${truncatedContent}"`,
      title: "New reply to your comment 💬",
    }

    console.log("[v0] Creating reply notification in database...")
    await createNotification(notificationData)

    console.log("[v0] Fetching push subscriptions for comment author:", commentAuthorId)
    const subscriptions = await getUserPushSubscriptions(commentAuthorId)
    console.log("[v0] Found", subscriptions.length, "push subscriptions")

    if (subscriptions.length > 0) {
      console.log("[v0] Active subscriptions found, sending push notifications...")
      const pushPayload = {
        title: "New reply to your comment 💬",
        body: `${replyAuthorName} replied: "${truncatedContent}"`,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: {
          postId,
          commentId: parentCommentId,
          type: "reply",
          url: `/post/${postId}#comment-${parentCommentId}`,
        },
      }

      // Send push notifications to all active subscriptions
      const pushResults = await Promise.allSettled(
        subscriptions
          .filter((sub) => sub.attributes.isActive)
          .map((sub) =>
            sendPushNotification(
              {
                id: sub.id,
                endpoint: sub.attributes.endpoint,
                p256dh: sub.attributes.p256dh,
                auth: sub.attributes.auth,
              },
              pushPayload,
            ),
          ),
      )

      const successCount = pushResults.filter((result) => result.status === "fulfilled" && result.value.success).length
      console.log("[v0] Push notifications sent:", successCount, "of", subscriptions.length)
    } else {
      console.log("[v0] ⚠️  No push subscriptions found for comment author", commentAuthorId)
      console.log("[v0] 💡 The comment author needs to enable notifications to receive push notifications")
    }

    // Revalidate relevant paths
    revalidatePath("/notifications")
    revalidatePath(`/post/${postId}`)

    return {
      success: true,
      message:
        subscriptions.length > 0
          ? "Reply notification created and push notifications sent"
          : "Reply notification created (comment author has no active push subscriptions)",
    }
  } catch (error) {
    console.error("[v0] Error creating reply notification:", error)
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

/**
 * Server action to send push notifications using web-push
 */
async function sendPushNotification(subscription: any, payload: any) {
  try {
    const webpush = await import("web-push")

    // Configure VAPID keys
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:your-email@example.com",
      process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
      process.env.VAPID_PRIVATE_KEY || "",
    )

    console.log("[v0] Sending push notification to:", subscription.endpoint)

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    const result = await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
    console.log("[v0] Push notification sent successfully")
    return { success: true, result }
  } catch (error: any) {
    console.error("[v0] Error sending push notification:", error)

    // Handle invalid subscriptions (410 Gone, 404 Not Found)
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log("[v0] Subscription is invalid, marking as inactive")
      try {
        // Mark subscription as inactive in Strapi
        const headers = await getAuthHeaders()
        await fetch(`${API_BASE_URL}/api/push-subscriptions/${subscription.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            data: { isActive: false },
          }),
        })
      } catch (updateError) {
        console.error("[v0] Failed to mark subscription as inactive:", updateError)
      }
    }

    return { success: false, error: error.message }
  }
}
