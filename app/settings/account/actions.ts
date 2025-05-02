"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { ProfileService, type UpdateProfileInput } from "@/lib/profile-service"

export interface ActionResponse {
  success: boolean
  message: string
  fieldErrors?: Record<string, string[]>
}

// Profile update validation schema
const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters")
    .optional(),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
})

// Get JWT token from cookies
function getToken(): string | null {
  const cookieStore = cookies()
  return cookieStore.get("jwt")?.value || null
}

export async function updateProfile(formData: FormData): Promise<ActionResponse> {
  try {
    // Get token from cookies
    const token = getToken()
    if (!token) {
      return {
        success: false,
        message: "Authentication required. Please log in again.",
      }
    }

    // Extract form data
    const rawData = {
      username: formData.get("username") as string,
      displayName: formData.get("displayName") as string,
      bio: formData.get("bio") as string,
    }

    // Only include fields that have values
    const updateData: UpdateProfileInput = {}
    if (rawData.username) updateData.username = rawData.username
    if (rawData.displayName) updateData.displayName = rawData.displayName
    if (rawData.bio) updateData.bio = rawData.bio

    // Validate the data
    const validationResult = profileSchema.safeParse(updateData)
    if (!validationResult.success) {
      return {
        success: false,
        message: "Validation failed",
        fieldErrors: validationResult.error.flatten().fieldErrors,
      }
    }

    console.log("Updating profile with data:", updateData)

    // Call the actual API to update the profile
    const updatedProfile = await ProfileService.updateProfile(token, updateData)

    if (!updatedProfile) {
      return {
        success: false,
        message: "Failed to update profile. Please try again.",
      }
    }

    // Revalidate the paths to refresh server data
    revalidatePath("/settings/account")
    revalidatePath("/profile")

    return {
      success: true,
      message: "Profile updated successfully",
    }
  } catch (error) {
    console.error("Profile update error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to update profile"

    // Check for session expiration
    if (errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorMessage.includes("expired")) {
      // Clear cookies and redirect to login
      cookies().delete("jwt")
      redirect("/auth")
    }

    return {
      success: false,
      message: errorMessage,
    }
  }
}

// Email update validation schema
const emailSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
  emailPassword: z.string().min(1, "Password is required"),
})

export async function updateEmail(formData: FormData): Promise<ActionResponse> {
  try {
    // Get token from cookies
    const token = getToken()
    if (!token) {
      return {
        success: false,
        message: "Authentication required. Please log in again.",
      }
    }

    // Extract and validate form data
    const rawData = {
      newEmail: formData.get("newEmail") as string,
      emailPassword: formData.get("emailPassword") as string,
    }

    // Validate the data
    const validationResult = emailSchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        message: "Validation failed",
        fieldErrors: validationResult.error.flatten().fieldErrors,
      }
    }

    // Here you would call your API to update the email
    // For now, we'll simulate a successful update
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      message: "Verification email sent to your new address",
    }
  } catch (error) {
    console.error("Email update error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update email",
    }
  }
}

// Password update validation schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export async function updatePassword(formData: FormData): Promise<ActionResponse> {
  try {
    // Get token from cookies
    const token = getToken()
    if (!token) {
      return {
        success: false,
        message: "Authentication required. Please log in again.",
      }
    }

    // Extract and validate form data
    const rawData = {
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    }

    // Validate the data
    const validationResult = passwordSchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        message: "Validation failed",
        fieldErrors: validationResult.error.flatten().fieldErrors,
      }
    }

    // Here you would call your API to update the password
    // For now, we'll simulate a successful update
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      message: "Password updated successfully",
    }
  } catch (error) {
    console.error("Password update error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update password",
    }
  }
}
