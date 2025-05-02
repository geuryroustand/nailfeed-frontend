/**
 * Simple in-memory cache for API responses - DISABLED AS REQUESTED
 * All caching functionality is commented out
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 15 * 60 * 1000 // 15 minutes in milliseconds (not used)

  /**
   * Get a value from the cache - DISABLED
   * @param key Cache key
   * @returns Always returns undefined since caching is disabled
   */
  get<T>(key: string): T | undefined {
    // Caching disabled as requested
    return undefined

    /* Original code commented out
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data as T
    */
  }

  /**
   * Set a value in the cache - DISABLED
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    // Caching disabled as requested
    return

    /* Original code commented out
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    })
    */
  }

  /**
   * Check if a key exists in the cache - DISABLED
   * @param key Cache key
   * @returns Always returns false since caching is disabled
   */
  has(key: string): boolean {
    // Caching disabled as requested
    return false

    /* Original code commented out
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
    */
  }

  /**
   * Delete a key from the cache - DISABLED
   * @param key Cache key
   */
  delete(key: string): void {
    // Caching disabled as requested
    return

    /* Original code commented out
    this.cache.delete(key)
    */
  }

  /**
   * Clear all entries from the cache - DISABLED
   */
  clear(): void {
    // Caching disabled as requested
    return

    /* Original code commented out
    this.cache.clear()
    */
  }

  /**
   * Get the number of entries in the cache - DISABLED
   */
  get size(): number {
    // Caching disabled as requested
    return 0

    /* Original code commented out
    // Clean up expired entries first
    this.cleanExpired()
    return this.cache.size
    */
  }

  /**
   * Clean up expired entries - DISABLED
   */
  cleanExpired(): void {
    // Caching disabled as requested
    return

    /* Original code commented out
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
    */
  }
}

// Export a singleton instance
export const apiCache = new ApiCache()

/**
 * Wrapper function to get data from cache or fetch it - MODIFIED TO ALWAYS FETCH
 * @param cacheKey Cache key (not used)
 * @param fetchFn Function to fetch data
 * @param ttl Time to live in milliseconds (not used)
 * @returns The data from the fetch function
 */
export async function getCachedOrFetch<T>(cacheKey: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
  // Caching disabled as requested - always fetch fresh data
  console.log(`Cache disabled, fetching fresh data for: ${cacheKey}`)
  try {
    return await fetchFn()
  } catch (error) {
    console.error(`Error fetching data for ${cacheKey}:`, error)

    // Check if it's a rate limit error
    if (error instanceof Error && (error.message.includes("Too Many Requests") || error.message.includes("429"))) {
      console.error("Rate limit exceeded")
      throw new Error("Too Many Requests")
    }

    throw error
  }
}
