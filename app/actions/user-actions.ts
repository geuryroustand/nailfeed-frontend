"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { validateSession } from "@/lib/auth/session"
import { UserService } from "@/lib/services/user-service"
import type {
  UserProfileResponse,
  UserUpdateInput,
} from "@/lib/services/user-service"

export type UserActionResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

async function getSessionToken() {
  const { session } = await validateSession()
  return session?.strapiJWT ?? null
}

async function getSessionUserId() {
  const { session } = await validateSession()
  return session?.userId ? Number(session.userId) : null
}

async function getSessionUserDocumentId() {
  const { user } = await validateSession()
  console.log('[getSessionUserDocumentId] User from session:', {
    hasUser: !!user,
    userId: user?.id,
    documentId: user?.documentId,
    username: user?.username
  })
  return user?.documentId || null
}

export async function getCurrentUser(): Promise<
  UserActionResult<UserProfileResponse>
> {
  try {
    const token = await getSessionToken()

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

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

export async function updateUserProfile(
  userData: UserUpdateInput,
): Promise<UserActionResult<UserProfileResponse>> {
  try {
    console.log('[UpdateUserProfile] Starting profile update with data:', JSON.stringify(userData, null, 2))

    const [token, userId] = await Promise.all([
      getSessionToken(),
      getSessionUserId(),
    ])

    console.log('[UpdateUserProfile] Authentication check:', {
      hasToken: !!token,
      userId: userId,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'none'
    })

    if (!token || !userId) {
      console.log('[UpdateUserProfile] Authentication failed - missing token or userId')
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Validation checks
    if (userData.displayName && userData.displayName.length > 50) {
      console.log('[UpdateUserProfile] Validation failed - displayName too long')
      return {
        success: false,
        error: "Display name must be less than 50 characters",
      }
    }

    if (userData.bio && userData.bio.length > 500) {
      console.log('[UpdateUserProfile] Validation failed - bio too long')
      return {
        success: false,
        error: "Bio must be less than 500 characters",
      }
    }

    console.log('[UpdateUserProfile] Calling UserService.updateProfile with userId:', userId)
    const updatedUser = await UserService.updateProfile(token, userId, userData)

    console.log('[UpdateUserProfile] UserService.updateProfile completed successfully')

    revalidatePath("/profile", "layout")
    revalidatePath("/", "layout")
    revalidateTag("user-profile")

    if (updatedUser?.username) {
      revalidateTag("user-" + updatedUser.username)
    }

    return {
      success: true,
      data: updatedUser ?? undefined,
    }
  } catch (error) {
    console.error("Error updating profile:", error)

    // Provide more specific error messages based on the error
    let errorMessage = "Failed to update profile"

    if (error instanceof Error) {
      if (error.message.includes('403')) {
        errorMessage = "Permission denied. You don't have permission to update this profile."
        console.log('[UpdateUserProfile] 403 Forbidden - user lacks permission to update profile')
      } else if (error.message.includes('401')) {
        errorMessage = "Authentication expired. Please log in again."
        console.log('[UpdateUserProfile] 401 Unauthorized - token may be expired')
      } else if (error.message.includes('404')) {
        errorMessage = "User not found. Please try logging in again."
        console.log('[UpdateUserProfile] 404 Not Found - user may not exist')
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function uploadProfileImage(
  formData: FormData,
): Promise<UserActionResult<{ imageUrl: string }>> {
  try {
    const [token, userId] = await Promise.all([
      getSessionToken(),
      getSessionUserId(),
    ])

    if (!token || !userId) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    const file = formData.get("profileImage") as File | null
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      }
    }

    if (file.size > 3 * 1024 * 1024) {
      return {
        success: false,
        error: "File size exceeds 3MB limit. Please choose a smaller image.",
      }
    }

    const success = await UserService.uploadProfileImage(token, userId, file)

    if (!success) {
      return {
        success: false,
        error: "Failed to upload profile image",
      }
    }

    const updatedUser = await UserService.getCurrentUser(token)
    const imageUrl = updatedUser?.profileImage?.url
      ? updatedUser.profileImage.url
      : ""

    revalidatePath("/profile", "layout")
    revalidatePath("/", "layout")
    revalidateTag("user-profile")

    if (updatedUser?.username) {
      revalidateTag("user-" + updatedUser.username)
    }

    return {
      success: true,
      data: { imageUrl },
    }
  } catch (error) {
    console.error("Error uploading profile image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    }
  }
}

export async function uploadCoverImage(
  formData: FormData,
): Promise<UserActionResult<{ imageUrl: string }>> {
  try {
    const [token, userId] = await Promise.all([
      getSessionToken(),
      getSessionUserId(),
    ])

    if (!token || !userId) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    const file = formData.get("coverImage") as File | null
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      }
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: "File size exceeds 5MB limit. Please choose a smaller image.",
      }
    }

    const success = await UserService.uploadCoverImage(token, userId, file)

    if (!success) {
      return {
        success: false,
        error: "Failed to upload cover image",
      }
    }

    const updatedUser = await UserService.getCurrentUser(token)
    const imageUrl = updatedUser?.coverImage?.url
      ? updatedUser.coverImage.url
      : ""

    revalidatePath("/profile", "layout")
    revalidatePath("/", "layout")
    revalidateTag("user-profile")

    if (updatedUser?.username) {
      revalidateTag("user-" + updatedUser.username)
    }

    return {
      success: true,
      data: { imageUrl },
    }
  } catch (error) {
    console.error("Error uploading cover image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    }
  }
}
