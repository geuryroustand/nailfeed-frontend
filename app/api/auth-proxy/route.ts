import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

// This is a server-side route that can safely use the API token
export async function POST(request: NextRequest) {
  try {
    const { endpoint, method, data } = await request.json()

    // Get the API token from environment variable
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN

    // Construct the full URL
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    const url = `${baseUrl}${path}`

    // Set up headers with authentication
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token exists
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`
    }

    // Get the JWT from cookies if it exists (server-side)
    const cookieStore = cookies()
    const jwt = cookieStore.get("jwt")?.value
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`
    }

    // Make the request
    const options: RequestInit = {
      method: method || "GET",
      headers,
      cache: "no-store",
    }

    // Add body for non-GET requests
    if (data && method !== "GET") {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)

    // Return the response data
    const responseData = await response.json()
    return NextResponse.json(responseData, { status: response.status })
  } catch (error) {
    console.error("API proxy error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
