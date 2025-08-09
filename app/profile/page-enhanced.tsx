import { Suspense } from "react"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { fetchCurrentUserProfileOptimized } from "@/lib/actions/current-user-actions"
import { ProfilePageLayout } from "@/components/profile/profile-page-layout"
import { ProfileHeaderServer } from "@/components/profile/profile-header-server"
import { ProfileStatsServer } from "@/components/profile/profile-stats-server"
import { ProfileGalleryServer } from "@/components/profile/profile-gallery-server"
import { ProfileNetworkServer } from "@/components/profile/profile-network-server"
import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
  ProfileGallerySkeleton,
} from "@/components/profile/profile-skeleton"
import CreatePostButton from "@/components/profile/create-post-button"

// Force dynamic rendering for user-specific content
export const dynamic = "force-dynamic"
export const revalidate = 0

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const profileData = await fetchCurrentUserProfileOptimized()

    if ("error" in profileData) {
      return {
        title: "Profile - NailFeed",
        description: "View your profile on NailFeed",
      }
    }

    const { user } = profileData
    return {
      title: `${user.displayName || user.username} - NailFeed`,
      description: user.bio || `${user.displayName || user.username}'s profile on NailFeed`,
      openGraph: {
        title: `${user.displayName || user.username} - NailFeed`,
        description: user.bio || `${user.displayName || user.username}'s profile on NailFeed`,
        images: user.profileImage?.url ? [user.profileImage.url] : [],
      },
    }
  } catch {
    return {
      title: "Profile - NailFeed",
      description: "View your profile on NailFeed",
    }
  }
}

export default async function ProfilePageEnhanced() {
  try {
    // Fetch profile data using optimized server action
    const profileData = await fetchCurrentUserProfileOptimized()

    // Handle authentication required case
    if ("error" in profileData && profileData.requiresAuth) {
      console.log("[Server] Authentication required, redirecting to login")
      return redirect("/auth?callbackUrl=/profile")
    }

    // Handle error case
    if ("error" in profileData) {
      console.error("[Server] Error rendering profile page:", profileData.message)
      throw new Error(profileData.message || "Failed to load profile")
    }

    // Extract profile data
    const { user, isOwnProfile } = profileData
    const showGuestBanner = isOwnProfile && !user.confirmed

    return (
      <ProfilePageLayout isOwnProfile={isOwnProfile} showGuestBanner={showGuestBanner}>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Profile Header with Suspense */}
          <Suspense fallback={<ProfileHeaderSkeleton />}>
            <ProfileHeaderServer user={user} isOtherUser={!isOwnProfile} />
          </Suspense>

          {/* Profile Stats with Suspense */}
          <Suspense fallback={<ProfileStatsSkeleton />}>
            <ProfileStatsServer user={user} />
          </Suspense>

          {/* Create Post Section - Only for own profile */}
          {isOwnProfile && (
            <Suspense fallback={null}>
              <ProfileCreatePostSection />
            </Suspense>
          )}

          {/* Profile Gallery with Suspense */}
          <Suspense fallback={<ProfileGallerySkeleton />}>
            <ProfileGalleryServer user={user} />
          </Suspense>

          {/* Network Section (Followers/Following) */}
          <Suspense fallback={<div className="p-4 text-center">Loading network...</div>}>
            <ProfileNetworkServer username={user.username} isOwnProfile={isOwnProfile} />
          </Suspense>
        </div>
      </ProfilePageLayout>
    )
  } catch (error) {
    console.error("[Server] Error rendering profile page:", error)
    return redirect("/auth?callbackUrl=/profile")
  }
}

// Separate component for create post section to enable code splitting
function ProfileCreatePostSection() {
  return (
    <div className="flex justify-center my-4 border-b border-gray-100 pb-4">
      <CreatePostButton />
    </div>
  )
}
