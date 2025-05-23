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
    const endpoint = "/api/posts/popular"
    const fullUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${endpoint.startsWith("/") ? endpoint.substring(1) : endpoint}`

    // Make the request
    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!response.ok) {
      throw new Error(`API error (${response.status})`)
    }

    const data = await response.json()

    // Extract post IDs from the response
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((post: any) => post.documentId || post.id).slice(0, 20) // Limit to 20 popular posts
    }

    return []
  } catch (error) {
    console.error("Error fetching popular post IDs:", error)
    return []
  }
})

// Function to check if a post is popular (for on-demand revalidation)
export async function isPopularPost(postId: string | number): Promise<boolean> {
  try {
    const popularIds = await getPopularPostIds()
    return popularIds.some((id) => id.toString() === postId.toString())
  } catch (error) {
    console.error("Error checking if post is popular:", error)
    return false
  }
}
