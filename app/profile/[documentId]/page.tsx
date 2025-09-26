import { Suspense } from "react"
import { notFound } from "next/navigation"
import { fetchUserProfileByDocumentId } from "@/lib/services/server-profile-service"
import ProfilePageLayout from "@/components/profile/profile-page-layout"
import ProfileHeader from "@/components/profile/profile-header"
import ProfileStats from "@/components/profile/profile-stats"
import { ProfileGalleryServer } from "@/components/profile/profile-gallery-server"
import FollowListsServer from "@/components/profile/follow-lists-server"
import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
  ProfileGallerySkeleton,
  FollowListsSkeleton,
} from "@/components/profile/profile-skeleton"
import { getProfileImageUrl, getCoverImageUrl } from "@/lib/image-url-helper"

// Set dynamic to force-dynamic to ensure we always get fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function UserProfilePage({ params }: { params: Promise<{ documentId: string }> }) {
  try {
    // Await params for Next.js 15 compatibility
    const resolvedParams = await params
    const documentId = resolvedParams.documentId

    if (!documentId) {
      console.error("No documentId provided in URL params")
      return notFound()
    }

    console.log(`Rendering profile page for documentId: ${documentId}`)

    // Use the optimized endpoint to get profile data by documentId
    const profileData = await fetchUserProfileByDocumentId(documentId)

    // Handle error case
    if ("error" in profileData) {
      console.error(`Error rendering user profile page: ${profileData.message || "Unknown error"}`)
      return notFound()
    }

    // Handle not found case
    if ("notFound" in profileData) {
      console.log(`User not found: ${documentId}`)
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

    // Log what we're passing to components
    console.log(`Rendering profile for ${user.username} (${documentId}) with:`)
    console.log(`- Posts: ${user.posts?.length || 0}`)
    console.log(`- Followers Count: ${user.followersCount || 0}`)
    console.log(`- Following Count: ${user.followingCount || 0}`)
    console.log(`- Profile Image: ${getProfileImageUrl(user.profileImage) ? "Available" : "Not available"}`)
    console.log(`- Cover Image: ${getCoverImageUrl(user.coverImage) ? "Available" : "Not available"}`)

    return (
      <ProfilePageLayout isOwnProfile={isOwnProfile} showGuestBanner={showGuestBanner}>
        {/* Profile Header Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Suspense fallback={<ProfileHeaderSkeleton />}>
            <ProfileHeader user={{ ...user, isFollowing: profileData.isFollowing }} isOtherUser={!isOwnProfile} />
          </Suspense>

          <Suspense fallback={<ProfileStatsSkeleton />}>
            <ProfileStats user={user} />
          </Suspense>
        </section>

        {/* Network Section */}
        <section className="mt-8">
          <Suspense fallback={<FollowListsSkeleton />}>
            <FollowListsServer
              username={user.username}
              documentId={documentId}
              isOwnProfile={isOwnProfile}
              followersCount={user.followersCount || 0}
              followingCount={user.followingCount || 0}
            />
          </Suspense>
        </section>

        {/* Profile Gallery Section */}
        <section className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
          <Suspense fallback={<ProfileGallerySkeleton />}>
            <ProfileGalleryServer user={{ ...user, documentId }} />
          </Suspense>
        </section>
      </ProfilePageLayout>
    )
  } catch (error) {
    console.error("Error rendering user profile page:", error)
    return notFound()
  }
}