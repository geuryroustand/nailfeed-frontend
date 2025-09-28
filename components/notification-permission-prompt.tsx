"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ensureServiceWorkerRegistration, getReadyServiceWorker } from "@/lib/pwa/register-service-worker"
import { useToast } from "@/hooks/use-toast"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Check if notifications are supported
    if ("Notification" in window && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      // Show prompt if user is authenticated and permission is default
      if (isAuthenticated && Notification.permission === "default") {
        // Delay showing prompt to avoid overwhelming user
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 3000)

        return () => clearTimeout(timer)
      }
    }
  }, [isAuthenticated])

  const persistPromptDismissal = () => {
    try {
      sessionStorage.setItem("notification-prompt-dismissed", "true")
    } catch (error) {
      console.warn("[v0] Unable to persist notification prompt dismissal", error)
    }
  }

  const requestNotificationPermission = async () => {
    if (!isSupported || !user) return

    setIsSubscribing(true)

    try {
      console.log("[v0] 🔔 Requesting notification permission for user:", user.id, user.documentId)

      // Request notification permission
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        console.log("[v0] ✅ Notification permission granted, setting up push subscription...")

        // Ensure we have an active service worker registration available
        const readyRegistration = await getReadyServiceWorker()
        const registration = readyRegistration ?? (await ensureServiceWorkerRegistration())
        if (!registration) {
          throw new Error("Service workers are not available in this browser")
        }

        // Reuse an existing subscription when possible to avoid duplicates
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          if (!vapidPublicKey) {
            throw new Error("VAPID public key not configured")
          }

          console.log("[v0] 📱 Creating new push subscription...")

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          })
        } else {
          console.log("[v0] ♻️  Reusing existing push subscription")
        }

        const subscriptionJson = subscription.toJSON()
        const endpoint = subscriptionJson?.endpoint
        const p256dh = subscriptionJson?.keys?.p256dh
        const auth = subscriptionJson?.keys?.auth

        if (!endpoint || !p256dh || !auth) {
          throw new Error("Invalid push subscription payload")
        }

        // Save subscription to server - use documentId if available, fallback to id
        const userIdentifier = user.documentId || user.id?.toString()
        if (!userIdentifier) {
          throw new Error("User identifier not available")
        }

        console.log("[v0] 💾 Saving push subscription to Strapi for user:", userIdentifier)

        const response = await fetch("/api/push-subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userIdentifier,
            endpoint,
            p256dh,
            auth,
            userAgent: navigator.userAgent,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error || "Failed to save push subscription")
        }

        console.log("[v0] 🎉 Push subscription saved successfully!")

        persistPromptDismissal()
        toast({
          title: "Notifications enabled",
          description: "You'll now receive notifications for comments and interactions",
        })
        setShowPrompt(false)
      } else {
        console.log("[v0] ❌ Notification permission denied or dismissed")
        toast({
          title: "Notifications blocked",
          description: "You can enable notifications in your browser settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error setting up notifications:", error)
      toast({
        title: "Error setting up notifications",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    // Don't show again for this session
    persistPromptDismissal()
  }

  // Don't show if not supported, not authenticated, or already granted/denied
  if (!isSupported || !isAuthenticated || !showPrompt || permission !== "default") {
    return null
  }

  // Don't show if dismissed in this session
  if (sessionStorage.getItem("notification-prompt-dismissed")) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-pink-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-pink-500" />
            <CardTitle className="text-sm">Stay Updated</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={dismissPrompt} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Get notified when someone comments on your posts or interacts with your content
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button onClick={requestNotificationPermission} disabled={isSubscribing} size="sm" className="flex-1">
            {isSubscribing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Setting up...
              </>
            ) : (
              <>
                <Bell className="h-3 w-3 mr-2" />
                Enable
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={dismissPrompt} className="flex-1 bg-transparent">
            <BellOff className="h-3 w-3 mr-2" />
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
