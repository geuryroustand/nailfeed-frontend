// Service Worker for Push Notifications
const CACHE_NAME = "nailfeed-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"]

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    }),
  )
})

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event)

  let notificationData = {}

  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (error) {
      console.error("[Service Worker] Error parsing push data:", error)
      notificationData = {
        title: "NailFeed",
        body: "You have a new notification",
        icon: "/icon-192x192.png",
      }
    }
  }

  const options = {
    body: notificationData.body || "You have a new notification",
    icon: notificationData.icon || "/icon-192x192.png",
    badge: notificationData.badge || "/icon-192x192.png",
    data: notificationData.data || {},
    actions: notificationData.actions || [
      {
        action: "view",
        title: "View",
        icon: "/icon-192x192.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(notificationData.title || "NailFeed", options))
})

// Notification click event - handle user interaction
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event)

  event.notification.close()

  if (event.action === "dismiss") {
    return
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus()
        }
      }

      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks here
      Promise.resolve(),
    )
  }
})
