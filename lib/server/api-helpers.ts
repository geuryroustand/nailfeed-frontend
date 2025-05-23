import { cookies } from "next/headers"

// Use NEXT_PUBLIC_APP_URL instead of API_URL
const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Get auth token with priority order: user JWT > API token
export function getServerAuthToken(): string | null {
  // Try to get user JWT from cookies first (server-side)
  const cookieStore = cookies()
  const cookieToken = cookieStore.get("jwt")?.value
  if (cookieToken) return cookieToken

  // Fall back to server-side API token (not exposed to client)
  return process.env.API_TOKEN || null
}

// Mock serverFetch function
export async function serverFetch(endpoint: string, options: RequestInit = {}) {
  const token = getServerAuthToken()
  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  // Always return mock data for now
  // In a real implementation, you would check if API_URL is available
  // and make a real fetch request if it is
  const mockData = {
    success: true,
    data: {
      message: "This is mock data from serverFetch",
      endpoint,
      timestamp: new Date().toISOString(),
    },
  }

  // Create a mock Response object
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(mockData),
    text: () => Promise.resolve(JSON.stringify(mockData)),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  } as Response)
}
