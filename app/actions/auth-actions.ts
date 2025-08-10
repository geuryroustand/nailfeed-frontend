"use server"

import { cookies } from "next/headers"
import { getApiBaseUrl } from "@/lib/get-api-base-url"

type RegistrationData = {
  username: string
  email: string
  password: string
}

export const registerUser = async (data: RegistrationData) => {
  try {
    const apiUrl = getApiBaseUrl()

    const response = await fetch(`${apiUrl}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result?.error?.message || "Registration failed",
      }
    }

    if (result?.jwt) {
      const cookieStore = await cookies()

      // Client-accessible auth token for compatibility with existing code
      cookieStore.set({
        name: "authToken",
        value: result.jwt,
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      })

      // Store email for verification flow
      cookieStore.set({
        name: "pendingVerificationEmail",
        value: data.email,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
        sameSite: "lax",
      })
    }

    return {
      success: true,
      user: result.user,
      jwt: result.jwt,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export const loginUser = async (data: {
  identifier: string
  password: string
  rememberMe?: boolean
}) => {
  try {
    const apiUrl = getApiBaseUrl()

    const response = await fetch(`${apiUrl}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        error: result?.error?.message || "Login failed",
      }
    }

    if (result?.jwt) {
      const maxAge = data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7
      const cookieStore = await cookies()

      cookieStore.set({
        name: "authToken",
        value: result.jwt,
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
        maxAge,
        path: "/",
        sameSite: "lax",
      })
    }

    return {
      success: true,
      user: result.user,
      jwt: result.jwt,
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export const logoutUser = async () => {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("authToken")
    cookieStore.delete("pendingVerificationEmail")
    cookieStore.delete("jwt")
    cookieStore.delete("auth_token")
    cookieStore.delete("userId")
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Failed to logout" }
  }
}

export const getCurrentUser = async () => {
  // Await the dynamic cookies API per Next.js 15 best practices [^2][^3]
  const cookieStore = await cookies()

  // Priority: client-readable tokens first, then httpOnly fallback
  const authToken =
    cookieStore.get("authToken")?.value ?? cookieStore.get("jwt")?.value ?? cookieStore.get("auth_token")?.value

  if (!authToken) {
    console.log("No authentication token found for getCurrentUser")
    return null
  }

  try {
    const apiUrl = getApiBaseUrl()

    const response = await fetch(`${apiUrl}/api/users/me?populate=profileImage`, {
      headers: { Authorization: `Bearer ${authToken}` },
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
