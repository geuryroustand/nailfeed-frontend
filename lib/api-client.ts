"use client"

import { cookies } from "next/headers"

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

// Cache configuration - DISABLED AS REQUESTED
// const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
// const cache: Record<string, { data: any; timestamp: number }> = {}

// Function to clear cache for specific endpoints or all cache - DISABLED
export const clearCache = (endpoint?: string) => {
  console.log("Cache is disabled, nothing to clear")
  /* Original code commented out
  if (endpoint) {
    // Clear specific endpoint
    const fullUrl = constructUrl(endpoint)
    delete cache[fullUrl]
    console.log(`Cleared cache for endpoint: ${endpoint}`)
  } else {
    // Clear all cache
    Object.keys(cache).forEach((key) => delete cache[key])
    console.log("Cleared all API cache")
  }
  */
}

// Helper function to construct URLs with the correct format
const constructUrl = (endpoint: string): string => {
  // Remove trailing slash from API_BASE_URL if it exists
  const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL

  // Remove leading slash from endpoint if it exists
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  // Combine them to ensure we have the correct format
  return `${baseUrl}${path}`
}

// Helper function to get auth token from cookies only
const getAuthToken = (): string | null => {
  // Try to get from cookies first
  try {
    const cookieToken = cookies().get("jwt")?.value
    if (cookieToken) return cookieToken
  } catch (e) {
    // Ignore errors when cookies() is called on the client side
  }

  // No token found in cookies
  return null
}

// API client with methods for different HTTP verbs
export const apiClient = {
  // GET request with fallback to public endpoint if authentication fails
  async get(endpoint: string, options: RequestInit = {}, bypassCache = false) {
    const url = constructUrl(endpoint)

    // CACHE DISABLED - Always bypass cache
    /* Original code commented out
    // Check cache first if not bypassing
    if (!bypassCache) {
      const cachedData = cache[url]
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log(`Cache hit for ${url}`)
        return cachedData.data
      }
    }
    */

    console.log(`Making GET request to ${url} (cache disabled)`)

    try {
      // Get auth token
      const token = getAuthToken()
      console.log(`Auth token available: ${token ? "Yes" : "No"}`)

      // Set headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Make the request
      const response = await fetch(url, {
        method: "GET",
        headers,
        ...options,
        cache: "no-store", // Ensure we don't use browser cache
      })

      // Handle rate limiting explicitly
      if (response.status === 429) {
        console.error("Rate limit exceeded for API request")
        throw new Error("Too Many Requests")
      }

      // If we get a 403 and we sent an auth token, try again without auth
      // This handles the case where the endpoint might be public but doesn't accept auth tokens
      if (response.status === 403 && token) {
        console.log("Got 403 with auth token, trying without auth...")

        // Remove Authorization header
        const publicHeaders = { ...headers }
        delete publicHeaders["Authorization"]

        const publicResponse = await fetch(url, {
          method: "GET",
          headers: publicHeaders,
          ...options,
          cache: "no-store",
        })

        if (publicResponse.ok) {
          const data = await publicResponse.json()

          // CACHE DISABLED - Don't cache the response
          /* Original code commented out
          // Cache the response
          if (!bypassCache) {
            cache[url] = { data, timestamp: Date.now() }
          }
          */

          return data
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()

      // CACHE DISABLED - Don't cache the response
      /* Original code commented out
      // Cache the response
      if (!bypassCache) {
        cache[url] = { data, timestamp: Date.now() }
        console.log(`Cached response for ${url}`)
      }
      */

      return data
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      throw error
    }
  },

  // POST request
  async post(endpoint: string, data: any = {}, options: RequestInit = {}) {
    const url = constructUrl(endpoint)
    console.log(`Making POST request to ${url}`)

    try {
      // Get auth token
      const token = getAuthToken()

      // Set headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Make the request
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        ...options,
      })

      // Handle rate limiting explicitly
      if (response.status === 429) {
        console.error("Rate limit exceeded for API request")
        throw new Error("Too Many Requests")
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const responseData = await response.json()

      // CACHE DISABLED - No need to clear cache
      // clearCache()

      return responseData
    } catch (error) {
      console.error(`Error posting to ${url}:`, error)
      throw error
    }
  },

  // PUT request
  async put(endpoint: string, data: any = {}, options: RequestInit = {}) {
    const url = constructUrl(endpoint)
    console.log(`Making PUT request to ${url}`)

    try {
      // Get auth token
      const token = getAuthToken()

      // Set headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Make the request
      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        ...options,
      })

      // Handle rate limiting explicitly
      if (response.status === 429) {
        console.error("Rate limit exceeded for API request")
        throw new Error("Too Many Requests")
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const responseData = await response.json()

      // CACHE DISABLED - No need to clear cache
      // clearCache()

      return responseData
    } catch (error) {
      console.error(`Error putting to ${url}:`, error)
      throw error
    }
  },

  // DELETE request
  async delete(endpoint: string, options: RequestInit = {}) {
    const url = constructUrl(endpoint)
    console.log(`Making DELETE request to ${url}`)

    try {
      // Get auth token
      const token = getAuthToken()

      // Set headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Make the request
      const response = await fetch(url, {
        method: "DELETE",
        headers,
        ...options,
      })

      // Handle rate limiting explicitly
      if (response.status === 429) {
        console.error("Rate limit exceeded for API request")
        throw new Error("Too Many Requests")
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      // CACHE DISABLED - No need to clear cache
      // clearCache()

      return await response.json()
    } catch (error) {
      console.error(`Error deleting ${url}:`, error)
      throw error
    }
  },
}
