"use client"

import { useEffect, useState } from "react"
import { INFINITE_SCROLL } from "@/lib/config"

interface InfiniteScrollDebugProps {
  isLoading: boolean
  hasMore: boolean
  totalPosts?: number
}

/**
 * Debug component to visualize infinite scroll performance in development
 * Only renders in development mode
 */
export function InfiniteScrollDebug({ isLoading, hasMore, totalPosts }: InfiniteScrollDebugProps) {
  const [loadCount, setLoadCount] = useState(0)
  const [lastLoadTime, setLastLoadTime] = useState<Date | null>(null)

  useEffect(() => {
    if (isLoading) {
      setLoadCount(prev => prev + 1)
      setLastLoadTime(new Date())
    }
  }, [isLoading])

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-50 space-y-1">
      <div className="font-semibold text-yellow-400">🚀 Infinite Scroll Debug</div>
      <div>Threshold: {INFINITE_SCROLL.THRESHOLD}</div>
      <div>Root Margin: {INFINITE_SCROLL.ROOT_MARGIN}</div>
      <div>Debounce: {INFINITE_SCROLL.DEBOUNCE_MS}ms</div>
      <hr className="border-gray-600" />
      <div>Load Count: {loadCount}</div>
      <div>Total Posts: {totalPosts || 0}</div>
      <div>Has More: {hasMore ? '✅' : '❌'}</div>
      <div>Loading: {isLoading ? '🔄' : '⏸️'}</div>
      {lastLoadTime && (
        <div>Last Load: {lastLoadTime.toLocaleTimeString()}</div>
      )}
    </div>
  )
}
