import { REQUEST_CONFIG } from "./config"

/**
 * Safely parse JSON from a response, handling errors
 */
export async function safeJsonParse(response: Response) {
  try {
    return await response.json()
  } catch (error) {
    console.error("Error parsing JSON response:", error)
    return { error: { message: "Failed to parse response" } }
  }
}

/**
 * Fetch with retry functionality
 * @param url The URL to fetch
 * @param options Fetch options
 * @param retries Number of retries
 * @param delay Delay between retries in ms
 * @returns Response
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = REQUEST_CONFIG.maxRetries,
  delay: number = REQUEST_CONFIG.retryDelay,
): Promise<Response> {
  try {
    const response = await fetch(url, options)

    // If the response is ok or we're out of retries, return it
    if (response.ok || retries <= 0) {
      return response
    }

    // Don't retry for certain status codes
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      return response
    }

    // Wait for the specified delay
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Retry with exponential backoff
    return fetchWithRetry(url, options, retries - 1, delay * 2)
  } catch (error) {
    if (retries <= 0) {
      throw error
    }

    // Wait for the specified delay
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Retry with exponential backoff
    return fetchWithRetry(url, options, retries - 1, delay * 2)
  }
}
