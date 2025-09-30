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
    const strapiUrl =
      process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://nailfeed-backend-production.up.railway.app"

    const response = await fetch(`${strapiUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error?.message || "Password reset request failed",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[auth-actions] Forgot password action failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}
