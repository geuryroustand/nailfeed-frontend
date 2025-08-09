/**
 * Gets the API URL from environment variables
 * @returns The API URL
 */
export function getApiUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

/**
 * Safely fetches data with better error handling
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The fetch response
 */
export async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    console.log(`Fetching: ${url}`)
    const response = await fetch(url, options)

    if (!response.ok) {
      console.error(`Fetch error: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.error(`Response body: ${text}`)
      throw new Error(`${response.status} ${response.statusText}`)
    }

    return response
  } catch (error) {
    console.error(`Fetch failed: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}
