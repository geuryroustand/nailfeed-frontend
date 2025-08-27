"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Smartphone } from "lucide-react"

const STORAGE_KEY = "nailfeed_visitor_count"
const NOTIFICATION_SHOWN_KEY = "nailfeed_first_visit_notification_shown"

function isPWAInstalled(): boolean {
  if (typeof window === "undefined") return false

  // Check if running in standalone mode (PWA installed)
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true
  }

  // Check for iOS Safari PWA
  if ((window.navigator as any).standalone === true) {
    return true
  }

  // Check for Android PWA indicators
  if (window.matchMedia("(display-mode: minimal-ui)").matches) {
    return true
  }

  return false
}

export default function FirstTimeVisitorNotification() {
  const { toast } = useToast()
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    if (isPWAInstalled()) {
      return
    }

    try {
      // Get current visit count
      const visitCount = Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10)
      const notificationShown = localStorage.getItem(NOTIFICATION_SHOWN_KEY) === "true"

      // Increment visit count
      const newVisitCount = visitCount + 1
      localStorage.setItem(STORAGE_KEY, newVisitCount.toString())

      // Show notification only on first visit and if not already shown
      if (newVisitCount === 1 && !notificationShown) {
        setShouldShow(true)
        localStorage.setItem(NOTIFICATION_SHOWN_KEY, "true")

        // Show toast notification
        toast({
          title: (
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-pink-500" />
              <span>Install NailFeed App</span>
            </div>
          ),
          description: (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Welcome! Visit this page 2+ times to enable installing NailFeed as a mobile app for the best experience.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <span>Visit 1 of 2+</span>
                </div>
              </div>
            </div>
          ),
          variant: "default",
        })
      }
    } catch (error) {
      // Handle localStorage errors gracefully
      console.warn("Failed to track visitor count:", error)
    }
  }, [toast])

  return null // This component doesn't render anything visible
}
