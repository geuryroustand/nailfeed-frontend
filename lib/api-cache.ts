// API Cache management
type CachedItem = {
  data: any
  timestamp: number
}

class ApiCache {
  private cache = new Map<string, CachedItem>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  // Rate limiting state
  private rateLimitState = {
    isLimited: false,
    resetTime: 0,
    consecutiveErrors: 0,
  }

  constructor(defaultTTL?: number) {
    if (defaultTTL) {
      this.defaultTTL = defaultTTL
    }
  }

  // Get an item from cache
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if item is expired
    if (Date.now() - item.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  // Set an item in cache
  set(key: string, data: any, ttl?: number): void {
    const expiryTime = ttl || this.defaultTTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })

    // Set up automatic cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key)
    }, expiryTime)
  }

  // Clear entire cache or specific key
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  // Check if we're currently rate limited
  isRateLimited(): boolean {
    if (!this.rateLimitState.isLimited) return false

    // Check if rate limit period has expired
    if (Date.now() > this.rateLimitState.resetTime) {
      this.rateLimitState.isLimited = false
      return false
    }

    return true
  }

  // Set rate limit state
  setRateLimit(durationMs = 30000): void {
    this.rateLimitState.isLimited = true
    this.rateLimitState.resetTime = Date.now() + durationMs

    // Auto-reset after duration
    setTimeout(() => {
      this.rateLimitState.isLimited = false
      console.log("Rate limit period expired, will try API again on next request")
    }, durationMs)
  }

  // Track consecutive errors
  trackError(isRateLimitError: boolean): void {
    if (isRateLimitError) {
      this.setRateLimit()
      return
    }

    this.rateLimitState.consecutiveErrors++

    // If we've had multiple consecutive errors, temporarily use fallback data
    if (this.rateLimitState.consecutiveErrors >= 3) {
      this.setRateLimit(60000) // 1 minute cooldown
      this.rateLimitState.consecutiveErrors = 0
      console.log("Multiple consecutive errors, cooling down API requests for 1 minute")
    }
  }

  // Reset error counter on successful request
  trackSuccess(): void {
    this.rateLimitState.consecutiveErrors = 0
  }

  // Get time remaining in rate limit (in seconds)
  getRateLimitRemainingTime(): number {
    if (!this.rateLimitState.isLimited) return 0
    return Math.max(0, Math.floor((this.rateLimitState.resetTime - Date.now()) / 1000))
  }
}

// Export a singleton instance
export const apiCache = new ApiCache()
