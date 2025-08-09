"use server"

import { cookies } from "next/headers"

type RegistrationData = {
  username: string
  email: string
  password: string
}

export async function registerUser(data: RegistrationData) {
  try {
    // Use NEXT_PUBLIC_API_URL or fallback to the backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    const response = await fetch(`${apiUrl}/api/auth/local/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      cache: "no-store",
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error?.message || "Registration failed",
      }
    }

    // Store JWT in a cookie - only HTTP-only in production
    if (result.jwt) {
      cookies().set({
        name: "authToken",
        value: result.jwt,
        httpOnly: process.env.NODE_ENV === "production", // Only HTTP-only in production
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax",
      })

      // Store email for verification in a cookie
      cookies().set({
        name: "pendingVerificationEmail",
        value: data.email,
        httpOnly: false, // Allow JavaScript access
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
        sameSite: "lax",
      })
    }

    return {
      success: true,
      user: result.user,
      jwt: result.jwt, // Return the JWT token to the client
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

export async function loginUser(data: {
  identifier: string
  password: string
  rememberMe?: boolean
}) {
  try {
    // Use NEXT_PUBLIC_API_URL or fallback to the backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    const response = await fetch(`${apiUrl}/api/auth/local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: data.identifier,
        password: data.password,
      }),
      cache: "no-store",
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error?.message || "Login failed",
      }
    }

    // Store JWT in a cookie - only HTTP-only in production
    if (result.jwt) {
      // Set cookie expiration based on "remember me" option
      const maxAge = data.rememberMe
        ? 60 * 60 * 24 * 30 // 30 days if "remember me" is checked
        : 60 * 60 * 24 * 7 // 1 week default

      cookies().set({
        name: "authToken",
        value: result.jwt,
        httpOnly: process.env.NODE_ENV === "production", // Only HTTP-only in production
        secure: process.env.NODE_ENV === "production",
        maxAge: maxAge,
        path: "/",
        sameSite: "lax",
      })
    }

    return {
      success: true,
      user: result.user,
      jwt: result.jwt, // Return the JWT token to the client
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

export async function logoutUser() {
  try {
    // Clear the auth cookie
    cookies().delete("authToken")

    // Clear any other cookies we might have set
    cookies().delete("pendingVerificationEmail")

    // Return success
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Failed to logout" }
  }
}

export async function getCurrentUser() {
  const authToken = cookies().get("authToken")?.value || cookies().get("jwt")?.value

  if (!authToken) {
    console.log("No authentication token found for getCurrentUser")
    return null
  }

  try {
    // Use NEXT_PUBLIC_API_URL or fallback to the backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    const response = await fetch(`${apiUrl}/api/users/me?populate=profileImage`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("Failed to fetch user data:", response.status, response.statusText)
      return null
    }

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}
