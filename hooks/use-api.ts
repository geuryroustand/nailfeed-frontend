"use client"

import { useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/context/auth-context"

type HttpMethod = "get" | "post" | "put" | "delete" | "upload"

export function useApi() {
  const { isAuthenticated, refreshToken } = useAuth()

  const is401 = (err: unknown): boolean => {
    if (!err) return false
    const e = err as any
    if (typeof e?.status === "number" && e.status === 401) return true
    if (typeof e?.response?.status === "number" && e.response.status === 401) return true
    if (typeof e?.cause?.status === "number" && e.cause.status === 401) return true
    if (typeof e?.message === "string" && e.message.includes("401")) return true
    return false
  }

  // Generic API request with authentication check
  const request = useCallback(
    async <T,>(method: HttpMethod, endpoint: string, data?: any, options?: RequestInit): Promise<T> => {
      try {
        switch (method) {
          case "get":
            return await apiClient.get<T>(endpoint, options)
          case "post":
            return await apiClient.post<T>(endpoint, data, options)
          case "put":
            return await apiClient.put<T>(endpoint, data, options)
          case "delete":
            return await apiClient.delete<T>(endpoint, options)
          case "upload":
            return await apiClient.upload<T>(endpoint, data as FormData, options)
          default:
            throw new Error(`Unsupported method: ${method}`)
        }
      } catch (error) {
        // If there's an authentication error, try to refresh the token
        if (is401(error)) {
          const success = await refreshToken()
          if (success) {
            // Retry the request after successful token refresh
            return request<T>(method, endpoint, data, options)
          }
        }
        throw error
      }
    },
    [isAuthenticated, refreshToken],
  )

  return {
    get: <T,>(endpoint: string, options?: RequestInit) => request<T>("get", endpoint, undefined, options),

    post: <T,>(endpoint: string, data: any, options?: RequestInit) => request<T>("post", endpoint, data, options),

    put: <T,>(endpoint: string, data: any, options?: RequestInit) => request<T>("put", endpoint, data, options),

    delete: <T,>(endpoint: string, options?: RequestInit) => request<T>("delete", endpoint, undefined, options),

    upload: <T,>(endpoint: string, formData: FormData, options?: RequestInit) =>
      request<T>("upload", endpoint, formData, options),
  }
}
