"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useScrollVelocity } from "./use-scroll-velocity"
import { fetchPostsAction } from "@/lib/actions/post-server-actions"
import { PRELOADING, PAGINATION } from "@/lib/config"
import type { Post } from "@/lib/post-data"

interface PreloadedData {
  posts: Post[]
  page: number
  timestamp: number
  isLoading: boolean
}

interface PreloadCache {
  [page: number]: PreloadedData
}

interface NetworkInfo {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  downlink?: number
  saveData?: boolean
}

interface UsePreloadManagerOptions {
  enabled?: boolean
  currentPage: number
  hasMore: boolean
  onPreloadSuccess?: (page: number, posts: Post[]) => void
  onPreloadError?: (page: number, error: Error) => void
}

interface PreloadMetrics {
  preloadedPages: number[]
  cacheSize: number
  cacheHitRate: number
  networkType: string
  preloadingEnabled: boolean
}

/**
 * Advanced preloading manager with intelligent caching and network awareness
 *
 * Features:
 * - Scroll velocity-based preloading triggers
 * - Smart cache management with TTL
 * - Network-aware loading strategies
 * - Predictive loading based on user behavior
 * - Memory-efficient cache with LRU eviction
 * - Comprehensive metrics and debugging
 *
 * @param options Configuration options
 * @returns Preload manager interface
 */
export function usePreloadManager({\n  enabled = PRELOADING.ENABLED,\n  currentPage,\n  hasMore,\n  onPreloadSuccess,\n  onPreloadError,\n}: UsePreloadManagerOptions) {\n  // State management\n  const [preloadCache, setPreloadCache] = useState<PreloadCache>({})\n  const [isPreloading, setIsPreloading] = useState(false)\n  const [metrics, setMetrics] = useState<PreloadMetrics>({\n    preloadedPages: [],\n    cacheSize: 0,\n    cacheHitRate: 0,\n    networkType: 'unknown',\n    preloadingEnabled: enabled,\n  })\n\n  // Refs for tracking\n  const preloadRequestsRef = useRef<Set<number>>(new Set())\n  const cacheHitsRef = useRef(0)\n  const cacheRequestsRef = useRef(0)\n  const lastPreloadTriggerRef = useRef(0)\n\n  // Get scroll velocity metrics\n  const scrollMetrics = useScrollVelocity()\n\n  // Network information (if available)\n  const networkInfo = useMemo<NetworkInfo>(() => {\n    if (typeof navigator !== 'undefined' && 'connection' in navigator) {\n      const connection = (navigator as any).connection\n      return {\n        effectiveType: connection?.effectiveType,\n        downlink: connection?.downlink,\n        saveData: connection?.saveData,\n      }\n    }\n    return {}\n  }, [])\n\n  // Calculate adjusted preload distance based on network\n  const adjustedPreloadDistance = useMemo(() => {\n    if (!PRELOADING.NETWORK_AWARE) return PRELOADING.PRELOAD_DISTANCE\n\n    const { effectiveType, saveData } = networkInfo\n\n    // Reduce preloading on slow connections or data saver mode\n    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {\n      return Math.max(1, Math.floor(PRELOADING.PRELOAD_DISTANCE / 2))\n    }\n\n    // Increase preloading on fast connections\n    if (effectiveType === '4g') {\n      return PRELOADING.PRELOAD_DISTANCE + 1\n    }\n\n    return PRELOADING.PRELOAD_DISTANCE\n  }, [networkInfo])\n\n  // Clean expired cache entries\n  const cleanExpiredCache = useCallback(() => {\n    const now = Date.now()\n    setPreloadCache(prev => {\n      const cleaned: PreloadCache = {}\n      let hasChanges = false\n\n      Object.entries(prev).forEach(([pageStr, data]) => {\n        if (now - data.timestamp < PRELOADING.CACHE_TTL) {\n          cleaned[parseInt(pageStr)] = data\n        } else {\n          hasChanges = true\n        }\n      })\n\n      return hasChanges ? cleaned : prev\n    })\n  }, [])\n\n  // LRU cache eviction when cache size exceeds limit\n  const evictLRUIfNeeded = useCallback(() => {\n    setPreloadCache(prev => {\n      const entries = Object.entries(prev)\n      if (entries.length <= PRELOADING.CACHE_SIZE) return prev\n\n      // Sort by timestamp (oldest first) and remove oldest entries\n      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)\n      const toKeep = sorted.slice(-PRELOADING.CACHE_SIZE)\n\n      const newCache: PreloadCache = {}\n      toKeep.forEach(([pageStr, data]) => {\n        newCache[parseInt(pageStr)] = data\n      })\n\n      return newCache\n    })\n  }, [])\n\n  // Preload a specific page\n  const preloadPage = useCallback(async (page: number) => {\n    // Skip if already loading or already cached\n    if (preloadRequestsRef.current.has(page) || preloadCache[page]) {\n      return\n    }\n\n    preloadRequestsRef.current.add(page)\n    setIsPreloading(true)\n\n    try {\n      const offset = (page - 1) * PAGINATION.LOAD_MORE_POST_LIMIT\n      const response = await fetchPostsAction(PAGINATION.LOAD_MORE_POST_LIMIT, offset)\n\n      if (response.error) {\n        throw new Error(response.error.message || `Failed to preload page ${page}`)\n      }\n\n      // Store in cache\n      setPreloadCache(prev => ({\n        ...prev,\n        [page]: {\n          posts: response.posts,\n          page,\n          timestamp: Date.now(),\n          isLoading: false,\n        }\n      }))\n\n      // Trigger success callback\n      onPreloadSuccess?.(page, response.posts)\n\n    } catch (error) {\n      console.warn(`[PreloadManager] Failed to preload page ${page}:`, error)\n      onPreloadError?.(page, error as Error)\n\n    } finally {\n      preloadRequestsRef.current.delete(page)\n      setIsPreloading(prev => preloadRequestsRef.current.size > 0)\n    }\n  }, [preloadCache, onPreloadSuccess, onPreloadError])\n\n  // Trigger preloading based on scroll behavior\n  const triggerPreloading = useCallback(() => {\n    if (!enabled || !hasMore) return\n\n    const now = Date.now()\n    const { isFastScrolling, isScrolling, direction } = scrollMetrics\n\n    // Only preload when scrolling down\n    if (direction !== 'down' || !isScrolling) return\n\n    // Throttle preload triggers (don't trigger too frequently)\n    if (now - lastPreloadTriggerRef.current < 1000) return\n\n    // Trigger preloading for fast scrolling or when approaching the end\n    const shouldPreload = isFastScrolling || \n      (isScrolling && scrollMetrics.velocity > PRELOADING.VELOCITY_THRESHOLD)\n\n    if (shouldPreload) {\n      lastPreloadTriggerRef.current = now\n\n      // Calculate pages to preload\n      const startPage = currentPage + 1\n      const endPage = Math.min(\n        startPage + adjustedPreloadDistance - 1,\n        currentPage + 10 // Don't preload too far ahead\n      )\n\n      // Trigger preloading for calculated range\n      for (let page = startPage; page <= endPage; page++) {\n        preloadPage(page)\n      }\n    }\n  }, [enabled, hasMore, scrollMetrics, currentPage, adjustedPreloadDistance, preloadPage])\n\n  // Get cached posts for a specific page\n  const getCachedPosts = useCallback((page: number): Post[] | null => {\n    cacheRequestsRef.current++\n    const cached = preloadCache[page]\n    \n    if (cached && Date.now() - cached.timestamp < PRELOADING.CACHE_TTL) {\n      cacheHitsRef.current++\n      return cached.posts\n    }\n    \n    return null\n  }, [preloadCache])\n\n  // Update metrics\n  useEffect(() => {\n    const preloadedPages = Object.keys(preloadCache).map(Number)\n    const cacheHitRate = cacheRequestsRef.current > 0 \n      ? (cacheHitsRef.current / cacheRequestsRef.current) * 100 \n      : 0\n\n    setMetrics({\n      preloadedPages,\n      cacheSize: preloadedPages.length,\n      cacheHitRate,\n      networkType: networkInfo.effectiveType || 'unknown',\n      preloadingEnabled: enabled,\n    })\n  }, [preloadCache, networkInfo.effectiveType, enabled])\n\n  // Trigger preloading based on scroll velocity\n  useEffect(() => {\n    triggerPreloading()\n  }, [triggerPreloading])\n\n  // Cleanup expired cache entries periodically\n  useEffect(() => {\n    const interval = setInterval(() => {\n      cleanExpiredCache()\n      evictLRUIfNeeded()\n    }, 30000) // Every 30 seconds\n\n    return () => clearInterval(interval)\n  }, [cleanExpiredCache, evictLRUIfNeeded])\n\n  return {\n    // Cache management\n    getCachedPosts,\n    preloadPage,\n    clearCache: () => setPreloadCache({}),\n    \n    // Status\n    isPreloading,\n    metrics,\n    \n    // Advanced features\n    preloadCache,\n    scrollMetrics,\n    networkInfo,\n    adjustedPreloadDistance,\n  }\n}