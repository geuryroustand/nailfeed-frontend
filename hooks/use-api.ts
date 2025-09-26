"use client"

import { useCallback } from "react"
import axios from "axios"
import { apiClient } from "@/lib/api-client"

/**
 * ⚠️ UPDATED: Simplified API hook for public requests only
 *
 * This hook is now designed for PUBLIC, UNAUTHENTICATED requests only.
 * For authenticated requests, use:
 * - Server Actions (recommended)
 * - useAuthenticatedApi() hook for auth-proxy requests
 */

type HttpMethod = "get" | "post" | "put" | "delete"

export function useApi() {
  // Generic request method for public endpoints
  const request = useCallback(
    async <T,>(method: HttpMethod, endpoint: string, data?: any): Promise<T> => {
      try {
        switch (method) {
          case "get":
            const getResponse = await apiClient.get(endpoint)
            return getResponse.data
          case "post":
            const postResponse = await apiClient.post(endpoint, data)
            return postResponse.data
          case "put":
            const putResponse = await apiClient.put(endpoint, data)
            return putResponse.data
          case "delete":
            const deleteResponse = await apiClient.delete(endpoint)
            return deleteResponse.data
          default:
            throw new Error(`Unsupported method: ${method}`)
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.warn("Authentication required. Use server actions or auth-proxy for authenticated requests.")
        }
        throw error
      }
    },
    []
  )

  return {
    // Public API methods
    get: <T,>(endpoint: string) => request<T>("get", endpoint),
    post: <T,>(endpoint: string, data?: any) => request<T>("post", endpoint, data),
    put: <T,>(endpoint: string, data?: any) => request<T>("put", endpoint, data),
    delete: <T,>(endpoint: string) => request<T>("delete", endpoint),

    // Health check
    testConnection: () => apiClient.testConnection(),
  }
}

/**
 * ✅ NEW: Hook for authenticated requests via auth-proxy
 * Use this for client-side authenticated operations
 */
export function useAuthenticatedApi() {
  const request = useCallback(
    async <T,>(method: HttpMethod, endpoint: string, data?: any): Promise<T> => {
      const proxyEndpoint = "/api/auth-proxy"

      const proxyData = {
        endpoint,
        method: method.toUpperCase(),
        ...(data && { data }),
      }

      try {
        const response = await fetch(proxyEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include session cookies
          body: JSON.stringify(proxyData),
        })

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error("Authenticated API request failed:", error)
        throw error
      }
    },
    []
  )

  return {
    // Authenticated API methods via auth-proxy
    get: <T,>(endpoint: string) => request<T>("get", endpoint),
    post: <T,>(endpoint: string, data?: any) => request<T>("post", endpoint, data),
    put: <T,>(endpoint: string, data?: any) => request<T>("put", endpoint, data),
    delete: <T,>(endpoint: string) => request<T>("delete", endpoint),
  }
}

/**
 * 📋 USAGE EXAMPLES:
 *
 * // ✅ Public requests
 * const api = useApi()
 * api.post("/api/auth/local/register", userData)
 * api.post("/api/auth/forgot-password", { email })
 *
 * // ✅ Authenticated requests (client-side)
 * const authApi = useAuthenticatedApi()
 * authApi.get("/api/users/me")
 * authApi.post("/api/posts", postData)
 *
 * // ✅ Preferred: Server actions (server-side)
 * import { updateProfile } from "@/app/actions/user-actions"
 * await updateProfile(profileData)
 */
