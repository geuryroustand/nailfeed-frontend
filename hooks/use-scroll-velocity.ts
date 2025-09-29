"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PRELOADING } from "@/lib/config"

interface ScrollMetrics {
  velocity: number          // Current scroll velocity in px/s
  direction: 'up' | 'down'  // Scroll direction
  acceleration: number      // Change in velocity
  isScrolling: boolean      // Whether user is actively scrolling
  isFastScrolling: boolean  // Whether scrolling fast (above threshold)
}

interface UseScrollVelocityOptions {
  sampleSize?: number       // Number of samples to track for velocity calculation
  throttleMs?: number       // Throttle scroll event handling
  velocityThreshold?: number // Minimum velocity to consider "scrolling"
  fastThreshold?: number    // Threshold for "fast scrolling"
}

/**
 * Advanced hook for tracking scroll velocity and predicting user behavior
 *
 * Features:
 * - Real-time velocity calculation with smoothing
 * - Scroll direction detection
 * - Acceleration/deceleration tracking
 * - Fast scrolling detection for predictive preloading
 * - Configurable thresholds and sample sizes
 * - Memory-efficient circular buffer for samples
 *
 * @param options Configuration options
 * @returns ScrollMetrics object with current scroll state
 */
export function useScrollVelocity({
  sampleSize = PRELOADING.SCROLL_PREDICTION_SAMPLES,
  throttleMs = 16, // ~60fps
  velocityThreshold = PRELOADING.VELOCITY_THRESHOLD,
  fastThreshold = PRELOADING.FAST_SCROLL_THRESHOLD,
}: UseScrollVelocityOptions = {}): ScrollMetrics {
  // State for scroll metrics
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    velocity: 0,
    direction: 'down',
    acceleration: 0,
    isScrolling: false,
    isFastScrolling: false,
  })

  // Refs for tracking scroll data
  const samplesRef = useRef<Array<{ timestamp: number; position: number }>>([])
  const lastScrollTimeRef = useRef<number>(0)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastVelocityRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)

  // Throttled scroll handler using RAF
  const handleScroll = useCallback(() => {
    if (rafIdRef.current) return

    rafIdRef.current = requestAnimationFrame(() => {
      const now = performance.now()
      const scrollY = window.scrollY

      // Add new sample to circular buffer
      samplesRef.current.push({ timestamp: now, position: scrollY })

      // Keep only the required number of samples
      if (samplesRef.current.length > sampleSize) {
        samplesRef.current.shift()
      }

      // Calculate velocity if we have enough samples
      if (samplesRef.current.length >= 2) {
        const samples = samplesRef.current
        const oldestSample = samples[0]
        const newestSample = samples[samples.length - 1]

        const timeDiff = newestSample.timestamp - oldestSample.timestamp
        const positionDiff = newestSample.position - oldestSample.position

        // Calculate velocity in px/s
        const currentVelocity = timeDiff > 0 ? (positionDiff / timeDiff) * 1000 : 0
        const absoluteVelocity = Math.abs(currentVelocity)

        // Calculate acceleration (change in velocity)
        const acceleration = currentVelocity - lastVelocityRef.current

        // Determine scroll direction
        const direction = positionDiff >= 0 ? 'down' : 'up'

        // Update metrics
        setMetrics({
          velocity: absoluteVelocity,
          direction,
          acceleration,
          isScrolling: absoluteVelocity > velocityThreshold,
          isFastScrolling: absoluteVelocity > fastThreshold,
        })

        lastVelocityRef.current = currentVelocity
      }

      // Clear the RAF flag
      rafIdRef.current = null
      lastScrollTimeRef.current = now

      // Set timeout to detect when scrolling stops
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setMetrics(prev => ({
          ...prev,
          velocity: 0,
          acceleration: 0,
          isScrolling: false,
          isFastScrolling: false,
        }))
        lastVelocityRef.current = 0
        // Keep some samples for next scroll session
        samplesRef.current = samplesRef.current.slice(-2)
      }, 150) // Stop detecting after 150ms of no scroll
    })
  }, [sampleSize, velocityThreshold, fastThreshold])

  // Setup scroll event listener
  useEffect(() => {
    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)

      // Cleanup
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [handleScroll])

  return metrics
}