// Minimal service worker for NailFeed
// Provides offline fallback for navigation requests without caching APIs

const CACHE_NAME = "nailfeed-shell-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/icon-192x192.png",
  "/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch((error) => console.warn("[SW] Precache failed", error))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event.request));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/icon-192x192.png",
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "NailFeed", options)
    );
  } catch (error) {
    console.error("[SW] Push payload parsing failed", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse) {
      return networkResponse;
    }
  } catch (error) {
    // Network request failed, fall back to cache
  }

  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(OFFLINE_URL);
  if (cachedResponse) {
    return cachedResponse;
  }

  return Response.error();
}

console.log("[SW] Ready with minimal offline fallback");
