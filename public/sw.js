const CACHE_NAME = "nailfeed-v1"
const urlsToCache = ["/", "/manifest.json", "/favicon.ico"]

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching essential resources")
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((error) => {
            console.log(`Failed to cache ${url}:`, error)
            return null
          }),
        ),
      )
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
            return new Response(
              `
              <!DOCTYPE html>
              <html>
                <head><title>Offline - NailFeed</title></head>
                <body style="font-family: system-ui; text-align: center; padding: 2rem;">
                  <h1>You're offline</h1>
                  <p>Please check your internet connection and try again.</p>
                </body>
              </html>
            `,
              {
                status: 200,
                headers: { "Content-Type": "text/html" },
              },
            )
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
