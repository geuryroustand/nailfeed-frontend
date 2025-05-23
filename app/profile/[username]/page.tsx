import { notFound } from "next/navigation"
import { fetchUserProfile } from "@/lib/optimized-profile-service"
import ProfilePageContent from "@/components/profile/profile-page-content"
import FollowLists from "@/components/profile/follow-lists"
import { getProfileImageUrl, getCoverImageUrl } from "@/lib/image-url-helper"

// Set dynamic to force-dynamic to ensure we always get fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  try {
    // Get the username from the URL params
    const username = params.username

    if (!username) {
      console.error("No username provided in URL params")
      return notFound()
    }

    console.log(`Rendering profile page for username: ${username}`)

    // Use the optimized endpoint to get profile data
    const profileData = await fetchUserProfile(username)

    // Handle error case
    if ("error" in profileData) {
      console.error(`Error rendering user profile page: ${profileData.message || "Unknown error"}`)
      return notFound()
    }

    // Handle not found case
    if ("notFound" in profileData) {
      console.log(`User not found: ${username}`)
      return notFound()
    }

    // We have valid profile data, render the profile page
    const { user, isOwnProfile, isAuthenticated } = profileData

    // Validate that we have a user object with required fields
    if (!user || !user.username) {
      console.error("Invalid user data returned from API")
      return notFound()
    }

    // For consistency with the /profile route, show guest banner if this is the user's own profile and they're not confirmed
    const showGuestBanner = isOwnProfile && !user.confirmed

    // Extract followers and following from user data if available
    const followers = user.followers || []
    const following = user.following || []

    // Log what we're passing to components
    console.log(`Rendering profile for ${username} with:`)
    console.log(`- Posts: ${user.posts?.length || 0}`)
    console.log(`- Followers: ${followers.length}`)
    console.log(`- Following: ${following.length}`)
    console.log(`- Profile Image: ${getProfileImageUrl(user.profileImage) ? "Available" : "Not available"}`)
    console.log(`- Cover Image: ${getCoverImageUrl(user.coverImage) ? "Available" : "Not available"}`)

    return (
      <>
        <ProfilePageContent user={user} isOwnProfile={isOwnProfile} showGuestBanner={showGuestBanner} />

        <div className="mb-12 px-4">
          <FollowLists
            username={username}
            isOwnProfile={isOwnProfile}
            prefetchedFollowers={followers}
            prefetchedFollowing={following}
          />
        </div>
      </>
    )
  } catch (error) {
    console.error("Error rendering user profile page:", error)
    return notFound()
  }
}
