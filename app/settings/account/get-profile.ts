import { cookies } from "next/headers"
import { getCurrentUser } from "@/app/actions/auth-actions"

export async function getProfile() {
  try {
    // This function uses cookies, so the page will be dynamic
    const cookieStore = await cookies()
    const authToken = cookieStore.get("authToken")?.value || cookieStore.get("jwt")?.value

    if (!authToken) {
      return {
        profile: null,
        user: null,
        isAuthenticated: false,
      }
    }

    // Get current user data
    const user = await getCurrentUser()

    if (!user) {
      return {
        profile: null,
        user: null,
        isAuthenticated: false,
      }
    }

    // For now, we'll use the user data as profile data
    // In a real app, you might have separate profile and user endpoints
    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName || user.username,
      bio: user.bio || "",
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return {
      profile,
      user,
      isAuthenticated: true,
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return {
      profile: null,
      user: null,
      isAuthenticated: false,
    }
  }
}
