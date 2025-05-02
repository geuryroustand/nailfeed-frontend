"use server"

import { cookies } from "next/headers"
import { revalidatePath, revalidateTag } from "next/cache"
import { UserService, type UserProfileResponse, type UserUpdateInput } from "@/lib/services/user-service"
import { redirect } from "next/navigation"
import { validateImage, IMAGE_VALIDATION_PRESETS } from "@/lib/image-validation"

export type UserActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get the current user's profile from the server
 */
export async function getCurrentUser(): Promise<UserActionResult<UserProfileResponse>> {
  try {
    // Get token from cookies
    const token = cookies().get("jwt")?.value

    if (!token) {
      console.log("No JWT token found in cookies")
      return {
        success: false,
        error: "Authentication required",
      }
    }

    console.log("Fetching user with token")
    const user = await UserService.getCurrentUser(token)

    if (!user) {
      console.log("Failed to fetch user profile")
      return {
        success: false,
        error: "Failed to fetch user profile",
      }
    }

    console.log("User profile fetched successfully")
    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error("Error in getCurrentUser action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get a user's profile by username
 */
export async function getUserByUsername(username: string): Promise<UserActionResult<UserProfileResponse>> {
  try {
    const user = await UserService.getUserByUsername(username)

    if (!user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error(`Error in getUserByUsername action for ${username}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(formData: FormData): Promise<UserActionResult<UserProfileResponse>> {
  try {
    // Get token from cookies
    const token = cookies().get("jwt")?.value

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Extract form data
    const userData: UserUpdateInput = {
      displayName: (formData.get("displayName") as string) || undefined,
      bio: (formData.get("bio") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
    }

    // Update profile
    const updatedUser = await UserService.updateProfile(token, userData)

    if (!updatedUser) {
      return {
        success: false,
        error: "Failed to update profile",
      }
    }

    // Revalidate paths and tags
    revalidatePath("/profile")
    revalidateTag("user-profile")

    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    console.error("Error in updateUserProfile action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Upload a profile image
 */
export async function uploadProfileImage(formData: FormData): Promise<UserActionResult<{ imageUrl: string }>> {
  try {
    // Get token from cookies
    const token = cookies().get("jwt")?.value

    if (!token) {
      console.error("No JWT token found in cookies for profile image upload")
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Get user ID
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      console.error("Failed to get current user for profile image upload:", userResult.error)
      return {
        success: false,
        error: "Failed to get current user",
      }
    }

    const userId = userResult.data.id

    // Get file from form data
    const file = formData.get("profileImage") as File
    if (!file) {
      console.error("No file provided for profile image upload")
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

    // Validate the image on the server side as well
    try {
      const validationResult = await validateImage(file, IMAGE_VALIDATION_PRESETS.profileImage)
      if (!validationResult.valid) {
        console.error("Image validation failed:", validationResult.message)
        return {
          success: false,
          error: validationResult.message || "Invalid image file",
        }
      }
    } catch (validationError) {
      console.error("Error validating image:", validationError)
      return {
        success: false,
        error: "Error validating image. Please try a different image.",
      }
    }

    console.log(`Uploading profile image for user ${userId} with token: ${token.substring(0, 10)}...`)

    try {
      // Upload image
      const success = await UserService.uploadProfileImage(token, userId, file)

      if (!success) {
        console.error("UserService.uploadProfileImage returned false")
        return {
          success: false,
          error: "Failed to upload image. Please try again with a smaller image.",
        }
      }

      // Fetch updated user to get new image URL
      const updatedUserResult = await getCurrentUser()
      if (!updatedUserResult.success || !updatedUserResult.data) {
        console.error("Failed to get updated user profile after image upload")
        return {
          success: false,
          error: "Failed to get updated user profile",
        }
      }

      // Revalidate paths and tags
      revalidatePath("/profile")
      revalidateTag("user-profile")

      return {
        success: true,
        data: {
          imageUrl: updatedUserResult.data.profileImage?.url || "",
        },
      }
    } catch (uploadError) {
      console.error("Error in profile image upload:", uploadError)
      return {
        success: false,
        error: uploadError instanceof Error ? uploadError.message : "Failed to upload image",
      }
    }
  } catch (error) {
    console.error("Error in uploadProfileImage action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Upload a cover image
 */
export async function uploadCoverImage(formData: FormData): Promise<UserActionResult<{ imageUrl: string }>> {
  try {
    // Get token from cookies
    const token = cookies().get("jwt")?.value

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
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

    // Validate the image on the server side as well
    try {
      const validationResult = await validateImage(file, IMAGE_VALIDATION_PRESETS.coverImage)
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.message || "Invalid image file",
        }
      }
    } catch (validationError) {
      console.error("Error validating image:", validationError)
      return {
        success: false,
        error: "Error validating image. Please try a different image.",
      }
    }

    console.log(`Uploading cover image for user ${userId}`)

    try {
      // Upload image
      const success = await UserService.uploadCoverImage(token, userId, file)

      if (!success) {
        return {
          success: false,
          error: "Failed to upload cover image. Please try again with a smaller image.",
        }
      }

      // Fetch updated user to get new image URL
      const updatedUserResult = await getCurrentUser()
      if (!updatedUserResult.success || !updatedUserResult.data) {
        return {
          success: false,
          error: "Failed to get updated user profile",
        }
      }

      // Revalidate paths and tags
      revalidatePath("/profile")
      revalidateTag("user-profile")

      return {
        success: true,
        data: {
          imageUrl: updatedUserResult.data.coverImage?.url || "",
        },
      }
    } catch (uploadError) {
      console.error("Error in cover image upload:", uploadError)
      return {
        success: false,
        error: uploadError instanceof Error ? uploadError.message : "Failed to upload cover image",
      }
    }
  } catch (error) {
    console.error("Error in uploadCoverImage action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Check if the user is authenticated
 */
export async function checkAuth(): Promise<UserActionResult<{ isAuthenticated: boolean }>> {
  try {
    // Get token from cookies
    const token = cookies().get("jwt")?.value

    if (!token) {
      return {
        success: true,
        data: { isAuthenticated: false },
      }
    }

    // Verify token by fetching user
    const user = await UserService.getCurrentUser(token)

    return {
      success: true,
      data: { isAuthenticated: !!user },
    }
  } catch (error) {
    console.error("Error in checkAuth action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      data: { isAuthenticated: false },
    }
  }
}

/**
 * Require authentication or redirect to login
 */
export async function requireAuth(callbackUrl?: string): Promise<UserProfileResponse> {
  try {
    console.log("Checking authentication status")
    const { success, data, error } = await getCurrentUser()

    console.log("Auth check result:", { success, error })

    if (!success || !data) {
      console.log("Authentication required, redirecting to login")
      const redirectUrl = callbackUrl ? `/auth?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth"
      redirect(redirectUrl)
    }

    console.log("User authenticated successfully")
    return data
  } catch (error) {
    console.error("Error in requireAuth:", error)
    // In case of error, redirect to login
    const redirectUrl = callbackUrl ? `/auth?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth"
    redirect(redirectUrl)
  }
}
