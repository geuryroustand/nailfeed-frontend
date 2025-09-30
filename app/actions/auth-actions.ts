"use server"

import { revalidatePath } from "next/cache"
import { validateSession, deleteSession } from "@/lib/auth/session"

export interface AuthResponse {
  success: boolean
  error?: string
}

export async function getCurrentUser() {
  try {
    const { user } = await validateSession()
    return user
  } catch (error) {
    console.error("[auth-actions] Failed to fetch current user:", error)
    return null
  }
}

export async function logoutAction(): Promise<AuthResponse> {
  try {
    await deleteSession()

    revalidatePath("/", "layout")
    revalidatePath("/me", "layout")
    revalidatePath("/me/settings", "layout")

    return { success: true }
  } catch (error) {
    console.error("[auth-actions] Logout action failed:", error)
    return { success: false, error: "Logout failed" }
  }
}

export async function forgotPasswordAction(email: string): Promise<AuthResponse> {
  try {
    // Get API URL from environment
    const apiUrl =
      process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Call Strapi's forgot password endpoint
    const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || "Failed to send reset link",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[auth-actions] Forgot password action failed:", error)
    return {
      success: false,
      error: "Failed to send reset link. Please try again.",
    }
  }
}
