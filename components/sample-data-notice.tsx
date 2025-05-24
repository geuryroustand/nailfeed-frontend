"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SampleDataNotice() {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDismissed = localStorage.getItem("sampleDataNoticeDismissed") === "true"
    setDismissed(isDismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("sampleDataNoticeDismissed", "true")
    setDismissed(true)
  }

  if (!mounted || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto z-50 md:max-w-md">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-t-lg md:rounded-lg shadow-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-800">Sample Data Mode</h3>
            <p className="text-sm text-amber-700 mt-1">
              You're viewing sample data. Connect to a real backend by updating your environment variables.
            </p>
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-500 hover:bg-amber-100 hover:text-amber-700 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
