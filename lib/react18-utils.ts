"use client"

import { startTransition, useTransition, useDeferredValue } from "react"

/**
 * Utility functions for React 18 features
 */

/**
 * Wraps a state update in startTransition to avoid blocking the UI
 * @param callback Function that updates state
 */
export function updateWithTransition(callback: () => void) {
  startTransition(() => {
    callback()
  })
}

/**
 * Custom hook that provides a deferred value and loading state
 * @param value The value to defer
 * @returns An object with the deferred value and whether it's pending
 */
export function useDeferredValueWithLoading<T>(value: T) {
  const deferredValue = useDeferredValue(value)
  const isPending = deferredValue !== value

  return { deferredValue, isPending }
}

/**
 * Custom hook for transition state with type safety
 * @returns An array with isPending state and transition function
 */
export function useTypedTransition(): [boolean, (callback: () => void) => void] {
  return useTransition()
}

/**
 * Batches multiple state updates for better performance
 * React 18 does this automatically in most cases, but this is useful for custom event handlers
 * @param updates Array of state update functions to batch
 */
export function batchStateUpdates(updates: Array<() => void>) {
  // React 18 automatically batches these, but we're making it explicit
  updates.forEach((update) => update())
}
