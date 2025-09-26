import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { fetchCurrentUserProfileOptimized } from "@/lib/services/current-user-server-service";
import ProfilePageLayout from "@/components/profile/profile-page-layout";
import ProfileHeader from "@/components/profile/profile-header";
import ProfileStats from "@/components/profile/profile-stats";
import { ProfileGalleryServer } from "@/components/profile/profile-gallery-server";
import FollowListsServer from "@/components/profile/follow-lists-server";
import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
  ProfileGallerySkeleton,
  FollowListsSkeleton,
} from "@/components/profile/profile-skeleton";
import { getProfileImageUrl, getCoverImageUrl } from "@/lib/image-url-helper";
import CreatePostButton from "@/components/profile/create-post-button";

// Set dynamic to force-dynamic to ensure we always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  try {
    console.log(`Rendering current user profile page`);

    // Use the optimized server service like profile/[documentId]
    const profileData = await fetchCurrentUserProfileOptimized();

    // Handle authentication required case
    if ("error" in profileData && profileData.requiresAuth) {
      console.log("Authentication required, redirecting to login");
      return redirect("/auth?callbackUrl=/me");
    }

    // Handle error case
    if ("error" in profileData) {
      console.error(
        `Error rendering profile page: ${
          profileData.message || "Unknown error"
        }`
      );
      return redirect("/auth?callbackUrl=/me");
    }

    // We have valid profile data, render the profile page
    const { user, isOwnProfile, isAuthenticated } = profileData;

    // Validate that we have a user object with required fields
    if (!user || !user.username) {
      console.error("Invalid user data returned from API");
      return redirect("/auth?callbackUrl=/me");
    }

    // Show guest banner if user is not confirmed
    const showGuestBanner = isOwnProfile && !user.confirmed;

    // Log what we're passing to components
    console.log(
      `Rendering profile for ${user.username} (${user.documentId}) with:`
    );
    console.log(`- Posts: ${user.posts?.length || 0}`);
    console.log(`- Followers Count: ${user.followersCount || 0}`);
    console.log(`- Following Count: ${user.followingCount || 0}`);
    console.log(`- Posts Count: ${user.postsCount || 0}`);
    console.log(
      `- Profile Image: ${
        getProfileImageUrl(user.profileImage) ? "Available" : "Not available"
      }`
    );
    console.log(
      `- Cover Image: ${
        getCoverImageUrl(user.coverImage) ? "Available" : "Not available"
      }`
    );

    return (
      <ProfilePageLayout
        isOwnProfile={isOwnProfile}
        showGuestBanner={showGuestBanner}
      >
        {/* Profile Header Section */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Suspense fallback={<ProfileHeaderSkeleton />}>
            <ProfileHeader
              user={{ ...user, isFollowing: undefined }}
              isOtherUser={false}
            />
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
              documentId={user.documentId}
              isOwnProfile={isOwnProfile}
              followersCount={user.followersCount || 0}
              followingCount={user.followingCount || 0}
            />
          </Suspense>
        </section>

        {/* Create Post Button - Only show on own profile */}
        {isOwnProfile && (
          <div className="flex justify-center mt-8">
            <Suspense fallback={null}>
              <CreatePostButton />
            </Suspense>
          </div>
        )}

        {/* Profile Gallery Section */}
        <section className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
          <Suspense fallback={<ProfileGallerySkeleton />}>
            <ProfileGalleryServer
              user={{ ...user, documentId: user.documentId }}
            />
          </Suspense>
        </section>
      </ProfilePageLayout>
    );
  } catch (error) {
    console.error("Error rendering profile page:", error);
    return redirect("/auth?callbackUrl=/me");
  }
}
