import { cookies } from "next/headers"
import { ProfileService } from "@/lib/profile-service"
import { AuthService } from "@/lib/auth-service"

export async function getProfile() {
  try {
    // Get token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("jwt")?.value

    if (!token) {
      return {
        profile: null,
        user: null,
        isAuthenticated: false,
        error: "No authentication token found",
      }
    }

    // Fetch user data
    const user = await AuthService.getCurrentUser(token)

    // Fetch profile data
    const profile = await ProfileService.getProfile(token)

    return {
      profile,
      user,
      isAuthenticated: !!user,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return {
      profile: null,
      user: null,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile",
    }
  }
}
