"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X, Share, Plus } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform?: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect iOS device
    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua)
    setIsIOS(ios)

    // Detect Safari (exclude Chrome/Firefox/Edge on iOS)
    const safari = ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
    setIsSafari(safari)

    // Detect standalone mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    setIsStandalone(standalone)

    // If already installed, do not show prompt
    if (standalone) return

    // Handle "beforeinstallprompt" (only works on Android/desktop Chromium)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // On iOS Safari, show custom guide after a short delay
    let timer: number | undefined
    if (ios && safari && !standalone) {
      timer = window.setTimeout(() => {
        setShowInstallPrompt(true)
      }, 2500)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  // Do not render if in standalone mode or prompt not active
  if (isStandalone || !showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install NailFeed</h3>
          <p className="text-xs text-gray-600 mt-1">
            {isIOS
              ? "Add to your Home Screen for the best experience."
              : "Add to your home screen for quick access."}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isIOS && isSafari && (
        // iOS Safari custom instructions
        <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-700 space-y-1">
            <p className="font-medium">To install:</p>
            <div className="flex items-center gap-2">
              <span>1. Tap</span>
              <Share className="h-3 w-3 text-blue-500" />
              <span className="font-medium">Share</span>
            </div>
            <div className="flex items-center gap-2">
              <span>2. Choose</span>
              <Plus className="h-3 w-3 text-gray-600" />
              <span className="font-medium">Add to Home Screen</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
            className="w-full h-8 bg-transparent"
          >
            Got it!
          </Button>
        </div>
      )}

      {!isIOS && (
        // Android/Chromium install prompt
        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="flex-1 h-8"
            disabled={!deferredPrompt}
          >
            <Download className="h-3 w-3 mr-1" />
            Install
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
            className="h-8 bg-transparent"
          >
            Later
          </Button>
        </div>
      )}
    </div>
  )
}
