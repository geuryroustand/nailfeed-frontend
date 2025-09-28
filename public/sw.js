// Enhanced Service Worker for NailFeed
// Provides network-first navigation, stale-while-revalidate for assets, and offline fallback

const STATIC_CACHE = "nailfeed-static-v2";
const RUNTIME_CACHE = "nailfeed-runtime-v1";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [OFFLINE_URL, "/icon-192x192.png", "/icon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((error) => {
        console.warn("[SW] Failed to pre-cache static assets", error);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, RUNTIME_CACHE].includes(key)) {
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
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  // Skip proxying API requests so the app can control caching headers
  if (requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: prefer network, fall back to cache/offline shell
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Same-origin static assets use stale-while-revalidate
  if (requestUrl.origin === self.location.origin && isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: try network, fall back to cache when offline
  event.respondWith(fetch(request).catch(() => caches.match(request)));
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
      requireInteraction: false,
      // TODO  check if tag is needed to prevent multiple notifications
      // tag: data.tag || 'nailfeed-notification',
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "NailFeed", options)
    );
  } catch (error) {
    console.error("[SW] Error processing push notification:", error);
    event.waitUntil(
      self.registration.showNotification("NailFeed", {
        body: "You have a new notification",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
        return undefined;
      })
  );
});

self.addEventListener("notificationclose", () => {
  // no-op placeholder for analytics hooks
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    if (request.mode === "navigate") {
      const offlineShell = await caches.match(OFFLINE_URL);
      if (offlineShell) {
        return offlineShell;
      }
    }

    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkFetch;
}

function isStaticAsset(request) {
  return ["style", "script", "image", "font"].includes(request.destination);
}

console.log(
  "[SW] Service worker registered with network-first navigation and offline fallback"
);
