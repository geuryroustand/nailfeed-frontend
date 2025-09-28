"use client"

import { useEffect } from "react"
import { ensureServiceWorkerRegistration, getReadyServiceWorker } from "@/lib/pwa/register-service-worker"

const WAITING_EVENT = "pwa:waiting"
const RELOADED_EVENT = "pwa:reloaded"

function dispatchWaiting(worker: ServiceWorker | null) {
  if (!worker) return
  window.dispatchEvent(new CustomEvent(WAITING_EVENT, { detail: worker }))
}

export default function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    let isMounted = true

    ensureServiceWorkerRegistration()
      .then(async (registration) => {
        if (!isMounted || !registration) return

        // Wait for the service worker to take control for consistency across browsers
        await getReadyServiceWorker()

        // Notify listeners if a waiting worker already exists
        dispatchWaiting(registration.waiting ?? null)

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              dispatchWaiting(newWorker)
            }
          })
        })
      })
      .catch((error) => {
        console.error("[PWA] Unable to register service worker", error)
      })

    const handleControllerChange = () => {
      window.dispatchEvent(new Event(RELOADED_EVENT))
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)

    return () => {
      isMounted = false
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
    }
  }, [])

  return null
}
