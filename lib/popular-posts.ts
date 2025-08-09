import { cache } from "react"

// Function to get popular post IDs for static generation
export const getPopularPostIds = cache(async (): Promise<(string | number)[]> => {
  try {
    // Check if we're using sample data
    const useSampleData = process.env.USE_SAMPLE_DATA === "true" || process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === "true"

    if (useSampleData) {
      // Return sample popular post IDs
      return ["post-1", "post-2", "post-3", "post-4", "post-5"]
    }

    // Get the token from environment variable
    const token = process.env.API_TOKEN || ""

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Construct the full URL for popular posts
    const apiUrl = process.env.API_URL || "https://nailfeed-backend-production.up.railway.app"
    const endpoint = "/api/posts"
    const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    // Make the request with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`Popular posts API returned ${response.status}, falling back to empty array`)
      return []
    }

    const data = await response.json()

    // Extract post IDs from the response
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((post: any) => post.documentId || post.id).slice(0, 10) // Limit to 10 popular posts
    }

    return []
  } catch (error) {
    console.warn(
      "Error fetching popular post IDs, falling back to empty array:",
      error instanceof Error ? error.message : String(error),
    )
    return []
  }
})

// Function to check if a post is popular (for on-demand revalidation)
export async function isPopularPost(postId: string | number): Promise<boolean> {
  try {
    const popularIds = await getPopularPostIds()
    return popularIds.some((id) => id.toString() === postId.toString())
  } catch (error) {
    console.warn("Error checking if post is popular:", error)
    return false
  }
}
