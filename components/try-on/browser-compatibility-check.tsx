"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function BrowserCompatibilityCheck() {
  const [compatibilityIssues, setCompatibilityIssues] = useState<string[]>([])

  useEffect(() => {
    const issues: string[] = []

    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push("Your browser doesn't support camera access, which is required for the try-on feature.")
    }

    // Check if browser supports canvas
    if (!document.createElement("canvas").getContext) {
      issues.push("Your browser doesn't support canvas, which is required for image processing.")
    }

    // Check if browser is running in a secure context (needed for camera access)
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      issues.push("Camera access requires a secure connection (HTTPS).")
    }

    // Check if browser supports WebAssembly (needed for MediaPipe)
    if (typeof WebAssembly !== "object") {
      issues.push("Your browser doesn't support WebAssembly, which is required for hand tracking.")
    }

    setCompatibilityIssues(issues)
  }, [])

  if (compatibilityIssues.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium mb-1">Browser Compatibility Issues:</div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {compatibilityIssues.map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
        </ul>
        <p className="text-sm mt-2">
          For the best experience, please use a modern browser like Chrome, Edge, or Safari.
        </p>
      </AlertDescription>
    </Alert>
  )
}
