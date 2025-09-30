"use client"

import { useEffect, useRef, useCallback } from "react"
import { INFINITE_SCROLL } from "@/lib/config"

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number
  rootMargin?: string
  debounceMs?: number
}

/**
 * Custom hook for optimized infinite scrolling
 *
 * Features:
 * - Configurable threshold and rootMargin for predictive loading
 * - Built-in debouncing to prevent excessive API calls
 * - Automatic cleanup and memory leak prevention
 * - TypeScript support with proper error handling
 *
 * @param options - Configuration options for the infinite scroll behavior
 * @returns ref - Ref to attach to the trigger element
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = INFINITE_SCROLL.THRESHOLD,
  rootMargin = INFINITE_SCROLL.ROOT_MARGIN,
  debounceMs = INFINITE_SCROLL.DEBOUNCE_MS,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(isLoading)

  // Keep loading state in sync for callback
  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  // Debounced load more function
  const debouncedLoadMore = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (!isLoadingRef.current && hasMore) {
        onLoadMore()
      }
    }, debounceMs)
  }, [onLoadMore, hasMore, debounceMs])

  useEffect(() => {
    const observerElement = observerRef.current

    // Early return if conditions aren't met
    if (!observerElement || !hasMore || isLoading) {
      return
    }

    // Create observer with optimized settings
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
          debouncedLoadMore()
        }
      },
      {
        threshold,
        rootMargin,
        // Use document root for better performance
        root: null,
      }
    )

    observer.observe(observerElement)

    // Cleanup function
    return () => {
      observer.disconnect()

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [hasMore, isLoading, threshold, rootMargin, debouncedLoadMore])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return observerRef
}
