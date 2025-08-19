"use server"

import { cookies } from "next/headers"

// Get the appropriate Strapi base URL based on auth type
function getStrapiUrl(authType: "google" | "regular" = "regular") {
  if (process.env.NODE_ENV === "development" && authType === "google") {
    return "http://127.0.0.1:1337"
  }

  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

export async function getCurrentUser(authType: "google" | "regular" = "regular") {
  try {
    const cookieStore = await cookies()

    // Try different cookie names for auth token
    const authToken =
      cookieStore.get("authToken")?.value || cookieStore.get("jwt")?.value || cookieStore.get("auth_token")?.value

    if (!authToken) {
      console.log("[v0] No auth token found in cookies")
      return null
    }

    console.log("[v0] Found auth token, making request to Strapi...")

    const strapiUrl = getStrapiUrl(authType)
    console.log("[v0] getCurrentUser using Strapi URL:", strapiUrl)

    const response = await fetch(`${strapiUrl}/api/users/me?populate=*`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Failed to fetch user data:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("[v0] Error response body:", errorText)
      return null
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[v0] Response is not JSON, content-type:", contentType)
      const responseText = await response.text()
      console.error("[v0] Non-JSON response body:", responseText)
      return null
    }

    try {
      const userData = await response.json()
      console.log("[v0] Successfully fetched user data:", userData?.username || "unknown user")
      return userData
    } catch (jsonError) {
      console.error("[v0] Failed to parse JSON response:", jsonError)
      // Try to get the response text for debugging
      const responseText = await response.text()
      console.error("[v0] Invalid JSON response body:", responseText)
      return null
    }
  } catch (error) {
    console.error("[v0] Error fetching current user:", error)
    return null
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies()

    // Clear all auth-related cookies
    cookieStore.delete("authToken")
    cookieStore.delete("jwt")
    cookieStore.delete("auth_token")
    cookieStore.delete("userId")

    return { success: true }
  } catch (error) {
    console.error("Error during logout:", error)
    return { success: false, error: "Logout failed" }
  }
}
