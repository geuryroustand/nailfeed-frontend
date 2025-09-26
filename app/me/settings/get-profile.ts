import { validateSession } from "@/lib/auth/session"
import { createStrapiClient } from "@/lib/auth/strapi-client"
import type { User } from "@/lib/auth/auth-service"

interface ProfileResult {
  profile: User | null
  user: User | null
  isAuthenticated: boolean
  error: string | null
}

export async function getProfile(): Promise<ProfileResult> {
  try {
    const { user, session } = await validateSession()

    if (!user || !session?.userId) {
      return {
        profile: null,
        user: null,
        isAuthenticated: false,
        error: "Not authenticated",
      }
    }

    // Fetch complete user profile from backend
    try {
      const client = await createStrapiClient()
      const userResponse = await client.get(`/api/users/${session.userId}?populate=*`)

      // Extract user data from response
      const fullUserData = userResponse.data || userResponse

      console.log('[GetProfile] Fetched complete user data:', {
        id: fullUserData.id,
        username: fullUserData.username,
        email: fullUserData.email,
        hasDisplayName: !!fullUserData.displayName,
        hasBio: !!fullUserData.bio,
        hasLocation: !!fullUserData.location,
        hasWebsite: !!fullUserData.website
      })

      return {
        profile: fullUserData,
        user: fullUserData,
        isAuthenticated: true,
        error: null,
      }
    } catch (fetchError) {
      console.error('Error fetching full profile from backend:', fetchError)
      // Fall back to session user data if backend fetch fails
      return {
        profile: user,
        user,
        isAuthenticated: true,
        error: null,
      }
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
