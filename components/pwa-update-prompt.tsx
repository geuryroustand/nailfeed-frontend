"use client"

import { useEffect, useState } from "react"
import { ensureServiceWorkerRegistration } from "@/lib/pwa/register-service-worker"
import { Button } from "@/components/ui/button"
import { RefreshCw, X } from "lucide-react"

const WAITING_EVENT = "pwa:waiting"
const RELOADED_EVENT = "pwa:reloaded"

export default function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }

    let isMounted = true

    const waitingListener: EventListener = (event) => {
      if (!isMounted) return
      const worker = (event as CustomEvent<ServiceWorker>).detail
      setWaitingWorker(worker)
      setShowUpdatePrompt(true)
    }

    const reloadedListener = () => {
      if (!isMounted) return
      setShowUpdatePrompt(false)
      setWaitingWorker(null)
    }

    window.addEventListener(WAITING_EVENT, waitingListener)
    window.addEventListener(RELOADED_EVENT, reloadedListener)

    ensureServiceWorkerRegistration()
      .then((registration) => {
        if (!isMounted || !registration) return
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setShowUpdatePrompt(true)
        }
      })
      .catch((error) => {
        console.warn("[PWA] Unable to check service worker status", error)
      })

    const handleControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)

    return () => {
      isMounted = false
      window.removeEventListener(WAITING_EVENT, waitingListener)
      window.removeEventListener(RELOADED_EVENT, reloadedListener)
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
    }
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" })
      setShowUpdatePrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
  }

  if (!showUpdatePrompt) return null

  return (
    <div className="fixed top-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Update Available</h3>
          <p className="text-xs text-gray-600 mt-1">A new version of NailFeed is ready</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={handleUpdate} size="sm" className="flex-1 h-8">
          <RefreshCw className="h-3 w-3 mr-1" />
          Update
        </Button>
        <Button variant="outline" onClick={handleDismiss} size="sm" className="h-8 bg-transparent">
          Later
        </Button>
      </div>
    </div>
  )
}
