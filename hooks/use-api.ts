"use client"

import { useState, useEffect, useCallback } from "react"

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  body?: any
  headers?: Record<string, string>
  cache?: RequestCache
  credentials?: RequestCredentials
  mode?: RequestMode
  retries?: number
  retryDelay?: number
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
  loading: boolean
  refetch: () => Promise<void>
}

export function useApi<T>(url: string, options: ApiOptions = {}): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const {
    method = "GET",
    body,
    headers = {},
    cache = "default",
    credentials = "include",
    mode = "cors",
    retries = 3,
    retryDelay = 1000,
  } = options

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Get the API URL from environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Construct the full URL
    const fullUrl = url.startsWith("http") ? url : `${apiUrl}${url}`

    // Get token from localStorage or cookie
    let token = null
    if (typeof window !== "undefined") {
      token = localStorage.getItem("jwt")
      if (!token) {
        const cookies = document.cookie.split(";")
        const jwtCookie = cookies.find((cookie) => cookie.trim().startsWith("jwt="))
        if (jwtCookie) {
          token = jwtCookie.split("=")[1].trim()
        }
      }
    }

    // Prepare headers with authentication if token exists
    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      cache,
      credentials,
      mode,
    }

    // Add body for non-GET requests
    if (method !== "GET" && body) {
      requestOptions.body = typeof body === "string" ? body : JSON.stringify(body)
    }

    let attempts = 0
    let lastError: Error | null = null

    while (attempts < retries) {
      try {
        const response = await fetch(fullUrl, requestOptions)
        setStatus(response.status)

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = Number.parseInt(response.headers.get("retry-after") || "1", 10)
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
          attempts++
          continue
        }

        // Handle authentication errors
        if (response.status === 401) {
          setError("Authentication required. Please log in.")
          setLoading(false)
          return
        }

        // Parse response
        if (response.status !== 204) {
          // 204 is No Content
          const responseData = await response.json()

          if (response.ok) {
            setData(responseData)
            setError(null)
          } else {
            const errorMessage = responseData.error?.message || responseData.message || "An error occurred"
            setError(errorMessage)
          }
        } else {
          // For 204 responses, set data to null (success with no content)
          setData(null)
          setError(null)
        }

        setLoading(false)
        return
      } catch (err) {
        lastError = err as Error
        attempts++

        // Only wait if we're going to retry
        if (attempts < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts))
        }
      }
    }

    // If we've exhausted all retries
    setError(lastError?.message || "Failed to fetch data after multiple attempts")
    setLoading(false)
  }, [url, method, body, headers, cache, credentials, mode, retries, retryDelay])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, error, status, loading, refetch: fetchData }
}

export default useApi
