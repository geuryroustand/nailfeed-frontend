// This file contains server-side only code
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

// Get auth token with priority order: user JWT > API token
export function getServerAuthToken(): string | null {
  // Try to get user JWT from cookies first
  const cookieToken = cookies().get("jwt")?.value
  if (cookieToken) return cookieToken

  // Fall back to server-side API token (not exposed to client)
  return process.env.API_TOKEN || null
}

// Helper for making authenticated API requests from the server
export async function serverFetch(endpoint: string, options: RequestInit = {}) {
  const token = getServerAuthToken()
  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  })
}
