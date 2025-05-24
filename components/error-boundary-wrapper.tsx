"use client"

import type { ReactNode } from "react"
import { ErrorBoundary } from "react-error-boundary"

// Error boundary fallback
function PageErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-6">We're having trouble loading the page. Please try refreshing.</p>
        <button
          onClick={resetErrorBoundary}
          className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

export default function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return <ErrorBoundary FallbackComponent={PageErrorFallback}>{children}</ErrorBoundary>
}
