// API diagnostics utility to help troubleshoot connection issues

/**
 * Tests the connection to the API by making a simple GET request
 * @param apiUrl The base API URL to test
 * @returns An object with the test results
 */
export async function testApiConnection(apiUrl = "https://nailfeed-backend-production.up.railway.app") {
  const results = {
    success: false,
    statusCode: 0,
    message: "",
    responseTime: 0,
    corsIssue: false,
    networkError: false,
    timeoutError: false,
  }

  const startTime = Date.now()

  try {
    // Create a timeout for the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      // Make a simple GET request to the API root
      const response = await fetch(`${apiUrl}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
        mode: "cors",
      })

      clearTimeout(timeoutId)

      results.statusCode = response.status
      results.success = response.ok
      results.message = response.ok ? "Connection successful" : `HTTP error: ${response.status} ${response.statusText}`

      // Try to get more details if there's an error
      if (!response.ok) {
        try {
          const errorData = await response.json()
          if (errorData.error?.message) {
            results.message = errorData.error.message
          }
        } catch (e) {
          // If we can't parse the error response, just use the status text
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId)

      results.success = false
      results.networkError = true

      if (error.name === "AbortError") {
        results.timeoutError = true
        results.message = "Connection timed out after 10 seconds"
      } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
        results.message = "Network error: Could not connect to the API"
      } else if (error.message.includes("CORS")) {
        results.corsIssue = true
        results.message = "CORS error: The API server is not allowing requests from this origin"
      } else {
        results.message = error.message || "Unknown connection error"
      }
    }
  } catch (error: any) {
    results.success = false
    results.networkError = true
    results.message = error.message || "Unknown error during connection test"
  }

  results.responseTime = Date.now() - startTime

  return results
}

/**
 * Checks if the current environment is likely to be a development environment
 */
export function isDevelopmentEnvironment(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("gitpod.io") ||
      window.location.hostname.includes("stackblitz") ||
      window.location.hostname.includes("codesandbox"))
  )
}

/**
 * Gets diagnostic information about the current environment
 */
export function getEnvironmentInfo() {
  if (typeof window === "undefined") {
    return {
      environment: "server",
      userAgent: "Server-side rendering",
      online: true,
    }
  }

  return {
    environment: isDevelopmentEnvironment() ? "development" : "production",
    userAgent: window.navigator.userAgent,
    online: window.navigator.onLine,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    connection: "connection" in window.navigator ? (window.navigator as any).connection : null,
  }
}
