"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react"

interface PostFeedErrorProps {
  error: string
  isConnectionError: boolean
  isLoading: boolean
  onRetry: () => void
}

export default function PostFeedError({ error, isConnectionError, isLoading, onRetry }: PostFeedErrorProps) {
  return (
    <div
      className={`${
        isConnectionError ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-red-50 border-red-200 text-red-700"
      } px-4 py-3 rounded-lg mb-6 border`}
    >
      <div className="flex items-center">
        {isConnectionError ? <WifiOff className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
        <p className="font-medium">{isConnectionError ? "Connection Issue" : "Error loading posts"}</p>
      </div>
      <p className="text-sm mt-1">{error}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry} disabled={isLoading}>
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </>
        )}
      </Button>
    </div>
  )
}
