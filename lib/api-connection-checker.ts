/**
 * Utility to check API connection status
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

/**
 * Checks if the API is accessible
 * @returns Promise resolving to an object with connection status information
 */
export async function checkApiConnection() {
  const startTime = performance.now()

  try {
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL

    // Try health check endpoint first
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health-check`, {
        method: "GET",
        cache: "no-store",
      })

      if (healthResponse.ok) {
        const endTime = performance.now()
        return {
          isConnected: true,
          latency: Math.round(endTime - startTime),
          error: null,
          lastChecked: new Date(),
        }
      }
    } catch (healthError) {
      // Health check failed, try root API
    }

    // Try root API endpoint
    const rootResponse = await fetch(`${baseUrl}/api`, {
      method: "GET",
      cache: "no-store",
    })

    const endTime = performance.now()

    return {
      isConnected: rootResponse.ok,
      latency: Math.round(endTime - startTime),
      error: rootResponse.ok ? null : `API returned status ${rootResponse.status}`,
      lastChecked: new Date(),
    }
  } catch (error) {
    return {
      isConnected: false,
      latency: null,
      error: error instanceof Error ? error.message : String(error),
      lastChecked: new Date(),
    }
  }
}

/**
 * Checks if a specific API endpoint is accessible
 * @param endpoint The API endpoint to check (without base URL)
 * @returns Promise resolving to an object with connection status information
 */
export async function checkApiEndpoint(endpoint: string) {
  const startTime = performance.now()

  try {
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    const url = endpoint.startsWith("/") ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    })

    const endTime = performance.now()

    return {
      isConnected: response.ok,
      latency: Math.round(endTime - startTime),
      error: response.ok ? null : `Endpoint returned status ${response.status}`,
      lastChecked: new Date(),
    }
  } catch (error) {
    return {
      isConnected: false,
      latency: null,
      error: error instanceof Error ? error.message : String(error),
      lastChecked: new Date(),
    }
  }
}
