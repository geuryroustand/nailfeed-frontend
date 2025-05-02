import { AuthService } from "./auth-service"

// Token refresh state
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null
let refreshSubscribers: Array<(token: string | null) => void> = []

// Subscribe to token refresh
export function subscribeToTokenRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback)
}

// Notify subscribers with new token
function notifySubscribers(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

// Refresh token and notify subscribers
export async function refreshAuthToken(): Promise<string | null> {
  // If already refreshing, return the existing promise
  if (isRefreshing) {
    return refreshPromise
  }

  // Get stored tokens
  const { refreshToken } = AuthService.getStoredTokens()

  // If no refresh token, clear everything and return null
  if (!refreshToken) {
    AuthService.clearTokens()
    return null
  }

  // Set refreshing state
  isRefreshing = true

  // Create refresh promise
  refreshPromise = new Promise<string | null>(async (resolve) => {
    try {
      // Attempt to refresh the token
      const response = await AuthService.refreshToken(refreshToken)

      if (response && response.jwt) {
        // Store new tokens
        AuthService.storeTokens(response.jwt, refreshToken)

        // Notify subscribers and resolve with new token
        notifySubscribers(response.jwt)
        resolve(response.jwt)
      } else {
        // If refresh failed, clear tokens and notify subscribers
        AuthService.clearTokens()
        notifySubscribers(null)
        resolve(null)
      }
    } catch (error) {
      console.error("Token refresh error:", error)

      // On error, clear tokens and notify subscribers
      AuthService.clearTokens()
      notifySubscribers(null)
      resolve(null)
    } finally {
      // Reset refreshing state
      isRefreshing = false
      refreshPromise = null
    }
  })

  return refreshPromise
}

// Create an axios interceptor-like function for fetch
export async function fetchWithTokenRefresh(url: string, options: RequestInit = {}): Promise<Response> {
  // Get stored tokens
  const { accessToken, expiresAt } = AuthService.getStoredTokens()

  // If no token or expired, try to refresh first
  if (!accessToken || (expiresAt && Date.now() >= expiresAt - 5 * 60 * 1000)) {
    const newToken = await refreshAuthToken()

    // If refresh successful, update Authorization header
    if (newToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      }
    }
  } else if (accessToken) {
    // Use existing token
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }

  // Make the request
  const response = await fetch(url, options)

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    const newToken = await refreshAuthToken()

    // If refresh successful, retry with new token
    if (newToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      }
      return fetch(url, options)
    }
  }

  return response
}
