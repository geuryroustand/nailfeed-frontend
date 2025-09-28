// Enhanced Service Worker for NailFeed - Next.js 15 Compatible
// Provides network-first navigation, cache-first for static assets, and offline fallback

const STATIC_CACHE = "nailfeed-static-v3";
const RUNTIME_CACHE = "nailfeed-runtime-v2";
const IMAGE_CACHE = "nailfeed-images-v1";
const OFFLINE_URL = "/offline.html";
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/manifest.json",
  "/diverse-user-avatars.png",
  "/placeholder.svg"
];

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
    Promise.all([
      // Clean up old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (![STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(key)) {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            }
            return undefined;
          })
        )
      ),
      // Clean up expired cache entries
      cleanExpiredCache()
    ])
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

  // Skip external resources that may violate CSP
  if (requestUrl.origin !== self.location.origin) {
    // Let external requests pass through without interception
    return;
  }

  // Navigation requests: prefer network, fall back to cache/offline shell
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Images get special caching treatment
  if (request.destination === "image") {
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE));
    return;
  }

  // Static assets use stale-while-revalidate
  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: try network, fall back to cache when offline for same-origin requests only
  event.respondWith(networkWithCacheFallback(request));
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
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {
        // Silently fail cache put to avoid blocking the response
      });
    }
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

    // Return a proper Response object instead of throwing
    return new Response('Network error', {
      status: 408,
      statusText: 'Request Timeout'
    });
  }
}

async function staleWhileRevalidate(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    const networkFetch = fetch(request)
      .then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone()).catch(() => {
            // Silently fail cache put to avoid blocking the response
          });
        }
        return response;
      })
      .catch(() => cachedResponse);

    return cachedResponse || networkFetch;
  } catch (error) {
    // Return a proper Response object on error
    return new Response('Cache error', {
      status: 500,
      statusText: 'Internal Server Error'
    });
  }
}

function isStaticAsset(request) {
  return ["style", "script", "font", "manifest"].includes(request.destination);
}

async function networkWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {
        // Silently fail cache put to avoid blocking the response
      });
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return a proper Response object instead of re-throwing
    return new Response('Network error', {
      status: 408,
      statusText: 'Request Timeout'
    });
  }
}

async function cacheFirstWithExpiry(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      const cachedDate = cached.headers.get('sw-cache-date');
      if (cachedDate) {
        const age = Date.now() - parseInt(cachedDate);
        if (age < CACHE_MAX_AGE) {
          return cached;
        }
      }
    }

    // Fetch from network
    const response = await fetch(request);
    if (response && response.ok) {
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-date', Date.now().toString());

      const cachedResponse = new Response(await responseClone.blob(), {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });

      cache.put(request, cachedResponse).catch(() => {
        // Silently fail cache put
      });
    }
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    return cached || new Response('Image load error', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

async function cleanExpiredCache() {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cachedDate = response.headers.get('sw-cache-date');
        if (cachedDate) {
          const age = Date.now() - parseInt(cachedDate);
          if (age > CACHE_MAX_AGE) {
            await cache.delete(request);
          }
        }
      }
    }
  } catch (error) {
    console.warn('[SW] Failed to clean expired cache:', error);
  }
}

console.log(
  "[SW] Service worker registered with network-first navigation and offline fallback"
);
