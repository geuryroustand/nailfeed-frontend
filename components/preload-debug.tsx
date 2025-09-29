"use client"

import { useState } from "react"
import { PRELOADING } from "@/lib/config"

interface PreloadDebugProps {
  preloadManager: {
    metrics: {
      preloadedPages: number[]
      cacheSize: number
      cacheHitRate: number
      networkType: string
      preloadingEnabled: boolean
    }
    scrollMetrics: {
      velocity: number
      direction: 'up' | 'down'
      acceleration: number
      isScrolling: boolean
      isFastScrolling: boolean
    }
    networkInfo: {
      effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
      downlink?: number
      saveData?: boolean
    }
    isPreloading: boolean
    adjustedPreloadDistance: number
  }
  currentPage: number
  totalPosts: number
}

/**
 * Debug component for preloading performance monitoring
 * Only visible in development mode
 */
export function PreloadDebug({ preloadManager, currentPage, totalPosts }: PreloadDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const { metrics, scrollMetrics, networkInfo, isPreloading, adjustedPreloadDistance } = preloadManager

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-sm">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="font-semibold text-blue-400">🚀 Preload Manager</div>
        <div className="text-gray-400">{isExpanded ? '−' : '+'}</div>
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-1">
          {/* Status */}
          <div className="border-b border-gray-600 pb-1 mb-2">
            <div>Status: {isPreloading ? '🔄 Loading' : '⏸️ Idle'}</div>
            <div>Enabled: {metrics.preloadingEnabled ? '✅' : '❌'}</div>
          </div>

          {/* Cache Info */}
          <div className="border-b border-gray-600 pb-1 mb-2">
            <div className="text-green-400 font-semibold">Cache</div>
            <div>Size: {metrics.cacheSize}/{PRELOADING.CACHE_SIZE}</div>
            <div>Hit Rate: {metrics.cacheHitRate.toFixed(1)}%</div>
            <div>Pages: [{metrics.preloadedPages.join(', ')}]</div>
            <div>Distance: {adjustedPreloadDistance}</div>
          </div>

          {/* Scroll Metrics */}
          <div className="border-b border-gray-600 pb-1 mb-2">
            <div className="text-yellow-400 font-semibold">Scroll</div>
            <div>Velocity: {scrollMetrics.velocity.toFixed(0)} px/s</div>
            <div>Direction: {scrollMetrics.direction} {scrollMetrics.direction === 'down' ? '⬇️' : '⬆️'}</div>
            <div>Fast: {scrollMetrics.isFastScrolling ? '🏃‍♂️' : '🚶‍♂️'}</div>
            <div>Active: {scrollMetrics.isScrolling ? '✅' : '❌'}</div>
          </div>

          {/* Network Info */}
          <div className="border-b border-gray-600 pb-1 mb-2">
            <div className="text-purple-400 font-semibold">Network</div>
            <div>Type: {networkInfo.effectiveType || 'unknown'}</div>
            {networkInfo.downlink && (
              <div>Speed: {networkInfo.downlink.toFixed(1)} Mbps</div>
            )}
            <div>Save Data: {networkInfo.saveData ? '✅' : '❌'}</div>
          </div>

          {/* General Info */}
          <div>
            <div className="text-gray-400 font-semibold">General</div>
            <div>Page: {currentPage}</div>
            <div>Posts: {totalPosts}</div>
          </div>

          {/* Configuration */}
          <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
            <div>Config:</div>
            <div>• Velocity Threshold: {PRELOADING.VELOCITY_THRESHOLD}px/s</div>
            <div>• Fast Threshold: {PRELOADING.FAST_SCROLL_THRESHOLD}px/s</div>
            <div>• Cache TTL: {PRELOADING.CACHE_TTL / 1000 / 60}min</div>
          </div>
        </div>
      )}
    </div>
  )
}