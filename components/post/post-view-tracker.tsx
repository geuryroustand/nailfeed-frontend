"use client"

import { useEffect } from "react"

interface PostViewTrackerProps {
  postId: number | string
}

export default function PostViewTracker({ postId }: PostViewTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      try {
        const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true"

        if (!analyticsEnabled) {
          console.log("[v0] Analytics tracking disabled")
          return
        }

        // Skip tracking in development
        if (process.env.NODE_ENV === "development") {
          console.log("[v0] Skipping analytics in development")
          return
        }

        console.log("[v0] Tracking post view for:", postId)

        const response = await fetch("/api/analytics/track-view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId,
            source: "web",
            timestamp: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          if (response.status === 405) {
            console.log(
              "[v0] Analytics endpoint not available on backend - consider setting NEXT_PUBLIC_ENABLE_ANALYTICS=false",
            )
          } else {
            console.error("Failed to track post view:", response.status, response.statusText)
          }
          return
        }

        console.log("[v0] Post view tracked successfully")
      } catch (error) {
        console.log("[v0] Analytics tracking unavailable:", error instanceof Error ? error.message : "Unknown error")
      }
    }

    trackView()
  }, [postId])

  // This component renders nothing
  return null
}
