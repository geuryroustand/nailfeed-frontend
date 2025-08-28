"use client"

import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { createCommentNotification } from "@/lib/actions/notification-actions"

export default function NotificationHandler() {
  const { user } = useAuth()

  useEffect(() => {
    const handleCommentAdded = async (event: CustomEvent) => {
      const { postId, commentData, content } = event.detail

      if (!user || !commentData) return

      try {
        // Extract comment author info from the response
        const commentAuthor = commentData.data?.attributes?.author
        if (!commentAuthor) return

        // Get post author info - this would need to be passed or fetched
        // For now, we'll handle this in the server action
        await createCommentNotification(
          postId.toString(),
          "", // Will be fetched in server action
          commentAuthor.id?.toString() || user.id,
          commentAuthor.name || user.username || user.name || "Anonymous",
          content,
        )
      } catch (error) {
        console.error("Failed to create comment notification:", error)
      }
    }

    // Listen for comment events
    window.addEventListener("commentAdded", handleCommentAdded as EventListener)

    return () => {
      window.removeEventListener("commentAdded", handleCommentAdded as EventListener)
    }
  }, [user])

  return null
}
