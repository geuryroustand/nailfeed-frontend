"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { subscribeToPushNotifications } from "@/lib/actions/notification-actions"
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

  const requestNotificationPermission = async () => {
    if (!isSupported || !user) return

    setIsSubscribing(true)

    try {
      console.log("[v0] NotificationPermissionPrompt - Requesting permission for user:", user.id)

      // Request notification permission
      const permission = await Notification.requestPermission()
      setPermission(permission)
      console.log("[v0] NotificationPermissionPrompt - Permission result:", permission)

      if (permission === "granted") {
        // Register service worker
        console.log("[v0] NotificationPermissionPrompt - Registering service worker")
        const registration = await navigator.serviceWorker.register("/sw.js")
        await navigator.serviceWorker.ready
        console.log("[v0] NotificationPermissionPrompt - Service worker registered")

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        console.log("[v0] NotificationPermissionPrompt - VAPID public key available:", !!vapidPublicKey)

        if (!vapidPublicKey) {
          throw new Error("VAPID public key not configured")
        }

        // Subscribe to push notifications
        console.log("[v0] NotificationPermissionPrompt - Subscribing to push notifications")
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })

        console.log("[v0] NotificationPermissionPrompt - Push subscription created:", {
          endpoint: subscription.endpoint,
          hasKeys: !!(subscription.getKey("p256dh") && subscription.getKey("auth")),
        })

        // Save subscription to server
        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
          },
        }

        console.log("[v0] NotificationPermissionPrompt - Saving subscription to server:", subscriptionData)
        const result = await subscribeToPushNotifications(user.id, subscriptionData)
        console.log("[v0] NotificationPermissionPrompt - Save result:", result)

        if (result.success) {
          toast({
            title: "Notifications enabled",
            description: "You'll now receive notifications for comments and interactions",
          })
          setShowPrompt(false)
        } else {
          throw new Error(result.error)
        }
      } else {
        console.log("[v0] NotificationPermissionPrompt - Permission denied")
        toast({
          title: "Notifications blocked",
          description: "You can enable notifications in your browser settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] NotificationPermissionPrompt - Error:", error)
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
    sessionStorage.setItem("notification-prompt-dismissed", "true")
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
