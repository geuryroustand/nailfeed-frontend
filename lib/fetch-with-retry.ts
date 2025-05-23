/**
 * Safely parse JSON from a response
 */
export async function safeJsonParse(response: Response) {
  try {
    return await response.json()
  } catch (error) {
    console.error("Error parsing JSON response:", error)
    return {}
  }
}

/**
 * Fetch with retry functionality
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 1000,
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If the response is a 429 (Too Many Requests), wait longer before retrying
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After")
        const retryAfterMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : retryDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, retryAfterMs))
        continue
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Only retry on network errors, not HTTP errors
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} attempts`)
}
