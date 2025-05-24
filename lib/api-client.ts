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
    return response.status === 200
  } catch (error) {
    console.error("API connection test failed:", error)
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

// Extend the axios instance type to include our custom methods
declare module "axios" {
  export interface AxiosInstance {
    testConnection: () => Promise<boolean>
    clearCache: () => void
  }
}

// Export the configured client
export { apiClient }
