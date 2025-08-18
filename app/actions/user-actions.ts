"use server"

import { cookies } from "next/headers"
import { revalidatePath, revalidateTag } from "next/cache"
import type { UserProfileResponse, UserUpdateInput } from "@/lib/services/user-service"
import { UserService } from "@/lib/services/user-service"
import { redirect } from "next/navigation"

export type UserActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

// Get current user
export async function getCurrentUser(): Promise<UserActionResult<UserProfileResponse>> {
  try {
    // Get token from cookies
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Use the UserService to fetch the current user
    const userData = await UserService.getCurrentUser(token)

    if (!userData) {
      return {
        success: false,
        error: "Failed to fetch user data",
      }
    }

    return {
      success: true,
      data: userData,
    }
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<UserActionResult<UserProfileResponse>> {
  try {
    // Get token from cookies for authenticated requests
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    // Use the UserService to fetch user by username
    const userData = await UserService.getUserByUsername(username, token)

    if (!userData) {
      return {
        success: false,
        error: `User ${username} not found`,
      }
    }

    return {
      success: true,
      data: userData,
    }
  } catch (error) {
    console.error(`Error fetching user ${username}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Update user profile - now accepts a direct JSON payload
export async function updateUserProfile(userData: UserUpdateInput): Promise<UserActionResult<UserProfileResponse>> {
  try {
    // Get fresh token directly from cookies - no caching
    const cookieStore = cookies()
    const token = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value

    if (!token) {
      console.error("[SERVER]\nNo JWT token found in cookies")
      return {
        success: false,
        error: "Authentication required - no token found",
      }
    }

    console.log("[SERVER]\nToken found in cookies:", token.substring(0, 10) + "...")
    console.log("[SERVER]\nupdateUserProfile received data:", JSON.stringify(userData, null, 2))

    // First, get the current user to get their ID
    const currentUserResult = await getCurrentUser()
    if (!currentUserResult.success || !currentUserResult.data) {
      return {
        success: false,
        error: "Failed to get current user information",
      }
    }

    const userId = currentUserResult.data.id
    console.log(`[SERVER]\nUpdating profile for user ID: ${userId}`)

    // Validate input data
    if (userData.displayName && userData.displayName.length > 50) {
      return {
        success: false,
        error: "Display name must be less than 50 characters",
      }
    }

    if (userData.bio && userData.bio.length > 500) {
      return {
        success: false,
        error: "Bio must be less than 500 characters",
      }
    }

    try {
      // Use the UserService to update the profile with the fresh token and user ID
      const updatedUser = await UserService.updateProfile(token, userId, userData)

      if (!updatedUser) {
        return {
          success: false,
          error: "Failed to update profile - no response from server",
        }
      }

      // Log the response from the server
      console.log("[SERVER]\nServer response after update:", JSON.stringify(updatedUser, null, 2))

      // Aggressive revalidation to ensure fresh data
      revalidatePath("/profile", "layout")
      revalidatePath("/", "layout")
      revalidateTag("user-profile")

      // Also revalidate any user-specific tags
      if (updatedUser.username) {
        revalidateTag(`user-${updatedUser.username}`)
      }

      return {
        success: true,
        data: updatedUser,
      }
    } catch (error) {
      console.error("[SERVER]\nError in UserService.updateProfile:", error)
      throw error // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    // Log the detailed error
    console.error("[SERVER]\nError updating profile:", error)
    console.error("[SERVER]\nFailed update data:", JSON.stringify(userData, null, 2))

    // Attempt to get more details if it's a response error
    if (error instanceof Response) {
      try {
        const errorText = await error.text()
        console.error("[SERVER]\nAPI error response:", errorText)
      } catch (e) {
        console.error("[SERVER]\nCould not parse error response")
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Upload profile image
export async function uploadProfileImage(formData: FormData): Promise<UserActionResult<{ imageUrl: string }>> {
  try {
    // Get fresh token directly from cookies - no caching
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      return {
        success: false,
        error: "Authentication required - no token found",
      }
    }

    // Get user ID
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: "Failed to get current user",
      }
    }

    const userId = userResult.data.id

    // Get file from form data
    const file = formData.get("profileImage") as File
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      }
    }

    // Check file size
    if (file.size > 3 * 1024 * 1024) {
      // 3MB limit
      return {
        success: false,
        error: "File size exceeds 3MB limit. Please choose a smaller image.",
      }
    }

    try {
      // Upload the profile image using the UserService with fresh token
      const success = await UserService.uploadProfileImage(token, userId, file)

      if (!success) {
        return {
          success: false,
          error: "Failed to upload profile image",
        }
      }

      // Get the updated user to get the new image URL
      const updatedUserResult = await getCurrentUser()
      const imageUrl =
        updatedUserResult.success && updatedUserResult.data?.profileImage?.url
          ? updatedUserResult.data.profileImage.url
          : `/placeholder.svg?height=300&width=300&query=profile+${userId}+${Date.now()}`

      // Revalidate paths and tags
      revalidatePath("/profile", "layout")
      revalidatePath("/", "layout")
      revalidateTag("user-profile")

      // Also revalidate any user-specific tags
      if (userResult.data.username) {
        revalidateTag(`user-${userResult.data.username}`)
      }

      return {
        success: true,
        data: {
          imageUrl,
        },
      }
    } catch (uploadError) {
      return {
        success: false,
        error: uploadError instanceof Error ? uploadError.message : "Failed to upload image",
      }
    }
  } catch (error) {
    console.error("Error in uploadProfileImage:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Upload cover image
export async function uploadCoverImage(formData: FormData): Promise<UserActionResult<{ imageUrl: string }>> {
  try {
    // Get fresh token directly from cookies - no caching
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      return {
        success: false,
        error: "Authentication required - no token found",
      }
    }

    // Get user ID
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: "Failed to get current user",
      }
    }

    const userId = userResult.data.id

    // Get file from form data
    const file = formData.get("coverImage") as File
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      }
    }

    // Check file size
    if (file.size > 3 * 1024 * 1024) {
      // 3MB limit
      return {
        success: false,
        error: "File size exceeds 3MB limit. Please choose a smaller image.",
      }
    }

    try {
      // Upload the cover image using the UserService with fresh token
      const success = await UserService.uploadCoverImage(token, userId, file)

      if (!success) {
        return {
          success: false,
          error: "Failed to upload cover image",
        }
      }

      // Get the updated user to get the new image URL
      const updatedUserResult = await getCurrentUser()
      const imageUrl =
        updatedUserResult.success && updatedUserResult.data?.coverImage?.url
          ? updatedUserResult.data.coverImage.url
          : `/placeholder.svg?height=1200&width=400&query=cover+${userId}+${Date.now()}`

      // Revalidate paths and tags
      revalidatePath("/profile", "layout")
      revalidatePath("/", "layout")
      revalidateTag("user-profile")

      // Also revalidate any user-specific tags
      if (userResult.data.username) {
        revalidateTag(`user-${userResult.data.username}`)
      }

      return {
        success: true,
        data: {
          imageUrl,
        },
      }
    } catch (uploadError) {
      return {
        success: false,
        error: uploadError instanceof Error ? uploadError.message : "Failed to upload cover image",
      }
    }
  } catch (error) {
    console.error("Error in uploadCoverImage:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Check authentication
export async function checkAuth(): Promise<UserActionResult<{ isAuthenticated: boolean }>> {
  try {
    // Get fresh token directly from cookies - no caching
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      return {
        success: true,
        data: { isAuthenticated: false },
      }
    }

    // Check if token is valid by trying to get the current user
    const userResult = await getCurrentUser()
    const isAuthenticated = userResult.success && !!userResult.data

    return {
      success: true,
      data: { isAuthenticated },
    }
  } catch (error) {
    console.error("Error checking authentication:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      data: { isAuthenticated: false },
    }
  }
}

// Require authentication
export async function requireAuth(callbackUrl?: string): Promise<UserProfileResponse> {
  try {
    console.log("Checking authentication...")

    // Get fresh token directly from cookies - no caching
    const token = cookies().get("jwt")?.value || cookies().get("authToken")?.value

    if (!token) {
      console.log("No JWT token found, redirecting to auth page")
      const redirectUrl = callbackUrl ? `/auth?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth"
      redirect(redirectUrl)
    }

    // Use the UserService directly to fetch the current user
    const userData = await UserService.getCurrentUser(token)

    if (!userData) {
      console.log("Failed to fetch user data, redirecting to auth page")
      const redirectUrl = callbackUrl ? `/auth?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth"
      redirect(redirectUrl)
    }

    console.log("User authenticated successfully:", userData.username)
    return userData
  } catch (error) {
    console.error("Error in requireAuth:", error)
    // In case of error, redirect to login
    const redirectUrl = callbackUrl ? `/auth?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth"
    redirect(redirectUrl)
  }
}
