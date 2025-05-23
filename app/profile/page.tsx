import { notFound, redirect } from "next/navigation"
import ProfilePageContent from "@/components/profile/profile-page-content"
import { fetchCurrentUserProfile } from "@/lib/current-user-service"

// Set dynamic to force-dynamic to ensure we always get fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProfilePage() {
  try {
    // Use the dedicated function to fetch current user profile data
    const profileData = await fetchCurrentUserProfile()

    // Handle authentication required case
    if ("error" in profileData && profileData.requiresAuth) {
      console.log("Authentication required, redirecting to login")
      return redirect("/auth?callbackUrl=/profile")
    }

    // Handle error case
    if ("error" in profileData) {
      console.error("Error rendering profile page:", profileData.message)
      return notFound()
    }

    // We have valid profile data, render the profile page
    const { user, isOwnProfile } = profileData

    // Show guest banner only if this is the user's own profile and they're not confirmed
    const showGuestBanner = isOwnProfile && !user.confirmed

    return <ProfilePageContent user={user} isOwnProfile={isOwnProfile} showGuestBanner={showGuestBanner} />
  } catch (error) {
    console.error("Error rendering profile page:", error)
    // Redirect to login on error
    return redirect("/auth?callbackUrl=/profile")
  }
}
