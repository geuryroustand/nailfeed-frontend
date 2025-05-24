"use client"

import axios from "axios"

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Ensure credentials are included with requests
  withCredentials: true,
})

// Add a request interceptor to include auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from localStorage or cookie
    let token = null

    // Try to get from localStorage first (client-side only)
    if (typeof window !== "undefined") {
      token = localStorage.getItem("jwt")

      // If not in localStorage, try cookies
      if (!token) {
        const cookies = document.cookie.split(";")
        const jwtCookie = cookies.find((cookie) => cookie.trim().startsWith("jwt="))
        if (jwtCookie) {
          token = jwtCookie.split("=")[1].trim()
        }
      }
    }

    // If token exists, add to headers
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    } else if (process.env.NEXT_PUBLIC_API_TOKEN) {
      // Use API token as fallback
      config.headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a direct method to test the API connection
apiClient.testConnection = async () => {
  try {
    const response = await apiClient.get("/")
    return true
  } catch (error) {
    return false
  }
}

/**
 * Clear any cached data in the API client
 */
export function clearCache(): void {
  // Clear any cached responses or stored data
  if (typeof window !== "undefined") {
    // Clear localStorage cache if any
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("api_cache_") || key.startsWith("cache_")) {
        localStorage.removeItem(key)
      }
    })
  }

  console.log("API client cache cleared")
}

// Add the clearCache method to the apiClient instance
apiClient.clearCache = clearCache

// Assuming this file exists and needs to be updated for React 18 compatibility

import { unstable_useTransition as useTransition } from "react"

// Throttle time in milliseconds
const THROTTLE_TIME = 500
let lastRequestTime = 0

/**
 * Enhanced API client with React 18 optimizations
 */
export async function fetchApi(url: string, options: RequestInit = {}) {
  // Implement request throttling
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < THROTTLE_TIME) {
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_TIME - timeSinceLastRequest))
  }

  lastRequestTime = Date.now()

  // Add authorization header if token exists
  const token = localStorage.getItem("auth_token")
  const headers = new Headers(options.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  // Set content type if not already set
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Safely parse JSON response
    let data
    const text = await response.text()

    try {
      data = text ? JSON.parse(text) : {}
    } catch (e) {
      console.error("Error parsing JSON response:", e)
      data = { error: "Invalid JSON response" }
    }

    // Check if response has an error property
    if (data && data.error) {
      throw new Error(data.error)
    }

    return data
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

/**
 * Fetch data with React 18 transition
 * This prevents the UI from being blocked during data fetching
 */
export function fetchWithTransition<T>(
  url: string,
  options: RequestInit = {},
  onSuccess: (data: T) => void,
  onError: (error: Error) => void,
) {
  const [startTransition, isPending] = useTransition()
  startTransition(() => {
    fetchApi(url, options)
      .then((data: T) => onSuccess(data))
      .catch(onError)
  })
}

// Export the configured client
export { apiClient }
