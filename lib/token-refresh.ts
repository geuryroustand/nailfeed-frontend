/**
 * ⚠️ DEPRECATED: Token refresh functionality has been consolidated
 *
 * The consolidated authentication service uses secure server-side session management
 * instead of client-side token refresh patterns.
 *
 * @see lib/auth/auth-service.ts for the new architecture
 */

import { AuthService } from "@/lib/auth/auth-service"

// Store subscribers to user auth state changes
const subscribers: ((user: any) => void)[] = []

// Subscribe to auth state changes
export function subscribeToTokenRefresh(callback: (user: any) => void) {
  console.warn("subscribeToTokenRefresh is deprecated. Use auth context state changes instead.")
  subscribers.push(callback)
}

// Notify all subscribers of auth state changes
export function notifyTokenRefresh(user: any) {
  console.warn("notifyTokenRefresh is deprecated. Use auth context state changes instead.")
  subscribers.forEach((callback) => callback(user))
}

// Refresh the user session (replacing token refresh)
export async function refreshAuthToken(): Promise<string | null> {
  console.warn("refreshAuthToken is deprecated. The consolidated service uses secure server-side sessions.")

  try {
    // Use the consolidated service to get current user (triggers session validation)
    const user = await AuthService.getCurrentUser()

    if (user) {
      // Notify subscribers of successful "refresh"
      notifyTokenRefresh(user)
      return "session-valid" // Legacy compatibility
    }

    return null
  } catch (error) {
    // Clear session on error
    notifyTokenRefresh(null)
    return null
  }
}

// Fetch with session validation (replacing token refresh pattern)
export async function fetchWithTokenRefresh(url: string, options: RequestInit = {}): Promise<Response> {
  console.warn("fetchWithTokenRefresh is deprecated. Use auth-proxy endpoints or server actions instead.")

  // For legacy compatibility, try to make the request with session cookies
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Include session cookies
  })

  // If the response is 401 Unauthorized, the session is invalid
  if (response.status === 401) {
    // Try to validate session first
    const user = await AuthService.getCurrentUser()

    if (user) {
      // Session is valid, retry the request
      return fetch(url, {
        ...options,
        credentials: "include",
      })
    } else {
      // Session is invalid, notify subscribers
      notifyTokenRefresh(null)
    }
  }

  return response
}

// Legacy compatibility exports with deprecation warnings
export const clearTokens = () => {
  console.warn("clearTokens is deprecated. Use AuthService.logout() instead.")
}

export const storeTokens = (accessToken: string, refreshToken?: string) => {
  console.warn("storeTokens is deprecated. The consolidated service uses secure server-side sessions.")
}

export const getStoredTokens = () => {
  console.warn("getStoredTokens is deprecated. The consolidated service uses secure server-side sessions.")
  return { accessToken: null, refreshToken: null }
}
