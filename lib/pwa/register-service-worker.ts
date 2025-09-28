"use client"

const SERVICE_WORKER_URL = "/sw.js"

/**
 * Ensure a service worker registration exists for the current scope.
 * Returns the active registration or null when service workers are unsupported.
 */
export async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration()
    if (existing) {
      return existing
    }

    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL)
    return registration
  } catch (error) {
    console.error("[PWA] Failed to register service worker", error)
    return null
  }
}

/**
 * Retrieve the ready service worker registration if available.
 */
export async function getReadyServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }

  try {
    return await navigator.serviceWorker.ready
  } catch (error) {
    console.error("[PWA] Failed to await service worker readiness", error)
    return null
  }
}
