/**
 * Utility function to retry fetch requests with exponential backoff
 * Especially focused on handling rate limiting (429) errors
 */

type FetchFunction<T> = () => Promise<T>

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryStatusCodes?: number[]
  onRetry?: (attempt: number, delay: number, error: any) => void
}

export async function fetchWithRetry<T>(fetchFn: FetchFunction<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 5, // Increased from 3 to 5
    initialDelay = 1000,
    maxDelay = 30000, // Increased from 10000 to 30000
    backoffFactor = 2,
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
    onRetry = () => {},
  } = options

  let lastError: any
  let delay = initialDelay

  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      // If this isn't the first attempt, log that we're retrying
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount}/${maxRetries} after ${delay}ms delay...`)
      }

      const response = await fetchFn()

      // If it's a Response object, check status code
      if (response instanceof Response) {
        if (retryStatusCodes.includes(response.status) && retryCount < maxRetries) {
          // Get retry delay from headers if available (e.g., Retry-After)
          const retryAfter = response.headers.get("Retry-After")
          let retryDelay = delay

          if (retryAfter) {
            // Retry-After can be a date string or seconds
            if (isNaN(Number(retryAfter))) {
              const retryDate = new Date(retryAfter)
              retryDelay = retryDate.getTime() - Date.now()
            } else {
              retryDelay = Number(retryAfter) * 1000
            }
            console.log(`Using Retry-After header: ${retryDelay}ms`)
          }

          // For 429 errors, use a longer delay if no Retry-After header
          if (response.status === 429 && !retryAfter) {
            retryDelay = Math.max(retryDelay, 5000 * Math.pow(backoffFactor, retryCount))
            console.log(`Rate limited (429), using longer delay: ${retryDelay}ms`)
          }

          // Clone the response before reading its body
          const clonedResponse = response.clone()

          // Try to read the response body for more information
          try {
            const errorBody = await clonedResponse.json()
            console.log(`Error response body:`, errorBody)

            // Some APIs include retry information in the response body
            if (errorBody?.retryAfter || errorBody?.retry_after) {
              const bodyRetryAfter = errorBody?.retryAfter || errorBody?.retry_after
              if (typeof bodyRetryAfter === "number") {
                retryDelay = bodyRetryAfter * 1000
                console.log(`Using retry delay from response body: ${retryDelay}ms`)
              }
            }
          } catch (e) {
            // Ignore errors reading the body
          }

          // Call the onRetry callback
          onRetry(retryCount, retryDelay, { status: response.status, statusText: response.statusText })

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay))

          // Increase delay for next retry using exponential backoff
          delay = Math.min(delay * backoffFactor, maxDelay)

          // Continue to next retry
          continue
        }
      }

      // Success - return the response
      return response
    } catch (error: any) {
      lastError = error
      console.error(`Fetch attempt ${retryCount + 1}/${maxRetries + 1} failed:`, error)

      // Check if the error contains a response with status code
      const status = error?.response?.status || error?.status
      if (status && retryStatusCodes.includes(status) && retryCount < maxRetries) {
        // Call the onRetry callback
        onRetry(retryCount, delay, error)

        // Special handling for 429 errors
        if (status === 429) {
          delay = Math.max(delay, 5000 * Math.pow(backoffFactor, retryCount))
          console.log(`Rate limited (429), using longer delay: ${delay}ms`)
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Increase delay for next retry using exponential backoff
        delay = Math.min(delay * backoffFactor, maxDelay)

        continue
      }

      // If we've reached max retries, throw the error
      if (retryCount >= maxRetries) {
        throw error
      }

      // Call the onRetry callback
      onRetry(retryCount, delay, error)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase delay for next retry using exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay)
    }
  }

  // This should never be reached due to the throw in the loop,
  // but TypeScript needs it for type safety
  throw lastError
}
