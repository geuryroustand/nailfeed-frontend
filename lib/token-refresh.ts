import { AuthService } from "./auth-service"

// Store subscribers to token refresh events
const subscribers: ((token: string | null) => void)[] = []

// Subscribe to token refresh events
export function subscribeToTokenRefresh(callback: (token: string | null) => void) {
  subscribers.push(callback)
}

// Notify all subscribers of a token refresh
export function notifyTokenRefresh(token: string | null) {
  subscribers.forEach((callback) => callback(token))
}

// Refresh the auth token
export async function refreshAuthToken(): Promise<string | null> {
  try {
    const { refreshToken } = AuthService.getStoredTokens()

    if (!refreshToken) {
      return null
    }

    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      // Clear tokens on refresh failure
      AuthService.clearTokens()
      notifyTokenRefresh(null)
      return null
    }

    const data = await response.json()

    if (data.jwt) {
      // Store the new tokens
      AuthService.storeTokens(data.jwt, data.refreshToken)

      // Notify subscribers
      notifyTokenRefresh(data.jwt)

      return data.jwt
    }

    return null
  } catch (error) {
    // Clear tokens on error
    AuthService.clearTokens()
    notifyTokenRefresh(null)
    return null
  }
}

// Fetch with token refresh
export async function fetchWithTokenRefresh(url: string, options: RequestInit = {}): Promise<Response> {
  // Get the current token
  const { accessToken } = AuthService.getStoredTokens()

  // Add the token to the headers if it exists
  const headers = new Headers(options.headers || {})
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If the response is 401 Unauthorized, try to refresh the token
  if (response.status === 401) {
    const newToken = await refreshAuthToken()

    // If we got a new token, retry the request
    if (newToken) {
      const newHeaders = new Headers(options.headers || {})
      newHeaders.set("Authorization", `Bearer ${newToken}`)

      return fetch(url, {
        ...options,
        headers: newHeaders,
      })
    }
  }

  return response
}
