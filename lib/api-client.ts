"use client"

import axios from "axios"

/**
 * ✅ SIMPLIFIED PUBLIC API CLIENT
 *
 * This client is designed for PUBLIC, UNAUTHENTICATED requests only.
 *
 * Usage Guidelines:
 * - ✅ Public Strapi endpoints (registration, password reset, public content)
 * - ✅ Health checks and connection testing
 * - ❌ NOT for authenticated requests
 *
 * For authenticated requests, use:
 * - Server Actions (recommended): app/actions/*
 * - Auth-proxy endpoints: /api/auth-proxy/*
 * - Server-side fetch in Server Components
 */

// Public base URL - safe for client-side use
const API_URL = process.env.NEXT_PUBLIC_API_URL ||
                "https://nailfeed-backend-production.up.railway.app"

// Create simplified axios instance for public requests only
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout for public requests
})

// ✅ SIMPLIFIED: Minimal interceptors for public requests only
apiClient.interceptors.request.use(
  (config) => {
    // Add any public request headers here if needed
    // No authentication logic - this is for public requests only
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Simple error handling for public requests
    if (error.response?.status === 401) {
      console.warn("Authentication required - use auth-proxy for authenticated requests")
    }
    return Promise.reject(error)
  }
)

// Connection test method for health checks
apiClient.testConnection = async (): Promise<boolean> => {
  try {
    await apiClient.get("/")
    return true
  } catch {
    return false
  }
}

/**
 * ✅ SECURITY: Removed localStorage cache clearing
 * Cache management should be handled by Next.js built-in mechanisms
 */
export function clearCache(): void {
  console.log("Cache clearing should be handled by Next.js revalidation mechanisms")
  console.log("Use revalidatePath() or revalidateTag() in server actions instead")
}

// Attach utility method for backward compatibility
apiClient.clearCache = clearCache

export { apiClient }

/**
 * 📋 USAGE EXAMPLES:
 *
 * ✅ Good - Public registration:
 * apiClient.post("/api/auth/local/register", userData)
 *
 * ✅ Good - Password reset request:
 * apiClient.post("/api/auth/forgot-password", { email })
 *
 * ✅ Good - Health check:
 * apiClient.testConnection()
 *
 * ❌ Bad - Authenticated requests:
 * apiClient.get("/api/users/me") // Use server action instead
 *
 * ❌ Bad - Protected endpoints:
 * apiClient.post("/api/posts", postData) // Use auth-proxy instead
 */
