"use server"

import { cookies } from "next/headers"

// Get the appropriate Strapi base URL
function getStrapiUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:1337"
  }

  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()

    // Try different cookie names for auth token
    const authToken =
      cookieStore.get("authToken")?.value || cookieStore.get("jwt")?.value || cookieStore.get("auth_token")?.value

    if (!authToken) {
      console.log("No auth token found in cookies")
      return null
    }

    const strapiUrl = getStrapiUrl()
    console.log("getCurrentUser using Strapi URL:", strapiUrl)

    const response = await fetch(`${strapiUrl}/api/users/me?populate=*`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch user data:", response.status, response.statusText)
      return null
    }

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error("Error fetching current user:", error)
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
