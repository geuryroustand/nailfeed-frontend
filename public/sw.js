const CACHE_NAME = "nailfeed-v1"
const urlsToCache = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/apple-icon.png",
  "/offline", // Add offline page to cache
]

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching essential resources")
      return cache.addAll(urlsToCache)
    }),
  )
  self.skipWaiting()
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.startsWith("chrome-extension://")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/offline") || new Response("Offline", { status: 200 })
          }
          return new Response("Network error", { status: 408 })
        })
      )
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})
