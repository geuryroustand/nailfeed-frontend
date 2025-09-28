// Enhanced Service Worker for NailFeed
// Provides network-first navigation, stale-while-revalidate for assets, and offline fallback

const STATIC_CACHE = "nailfeed-static-v3";
const RUNTIME_CACHE = "nailfeed-runtime-v1";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/placeholder.jpg",
];
const ANALYTICS_HOSTS = new Set([
  "www.google-analytics.com",
  "region1.google-analytics.com",
  "www.googletagmanager.com",
  "stats.g.doubleclick.net",
]);

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

  if (ANALYTICS_HOSTS.has(requestUrl.hostname)) {
    event.respondWith(fetchAnalytics(request));
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (requestUrl.origin === self.location.origin && isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(fetchWithFallback(request));
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
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const offlineShell = await caches.match(OFFLINE_URL);
    if (offlineShell) {
      return offlineShell;
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkFetch;
}

async function fetchWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response && shouldCacheRuntime(request, response)) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return offlineResponseFor(request);
  }
}

async function fetchAnalytics(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(null, { status: 204 });
  }
}

async function offlineResponseFor(request) {
  if (request.destination === "document") {
    const offlineShell = await caches.match(OFFLINE_URL);
    if (offlineShell) {
      return offlineShell;
    }
  }

  if (request.destination === "image") {
    const fallbackImage = await caches.match("/placeholder.jpg");
    if (fallbackImage) {
      return fallbackImage;
    }
  }

  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain" },
  });
}

function shouldCacheRuntime(request, response) {
  if (!response || !response.ok) {
    return false;
  }

  if (request.url.startsWith(self.location.origin)) {
    return ["style", "script", "image", "font"].includes(request.destination);
  }

  return false;
}

function isStaticAsset(request) {
  return ["style", "script", "image", "font"].includes(request.destination);
}

console.log(
  "[SW] Service worker registered with network-first navigation and offline fallback"
);
