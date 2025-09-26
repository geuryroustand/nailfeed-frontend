import { redirect } from "next/navigation";
import { fetchCurrentUserProfileOptimized } from "@/lib/actions/current-user-actions";
import ProfilePageContent from "@/components/profile/profile-page-content";
import { Suspense } from "react";
import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
} from "@/components/profile/profile-skeleton";

// Set dynamic to force-dynamic to ensure we always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePageOptimized() {
  try {
    // Use the dedicated server action to fetch current user profile data
    const profileData = await fetchCurrentUserProfileOptimized();

    // Handle authentication required case
    if ("error" in profileData && profileData.requiresAuth) {
      console.log("[Server] Authentication required, redirecting to login");
      return redirect("/auth?callbackUrl=/me");
    }

    // Handle error case
    if ("error" in profileData) {
      console.error(
        "[Server] Error rendering profile page:",
        profileData.message
      );
      throw new Error(profileData.message || "Failed to load profile");
    }

    // We have valid profile data, render the profile page
    const { user, isOwnProfile } = profileData;

    // Show guest banner only if this is the user's own profile and they're not confirmed
    const showGuestBanner = isOwnProfile && !user.confirmed;

    return (
      <Suspense
        fallback={
          <div>
            <ProfileHeaderSkeleton />
            <ProfileStatsSkeleton />
          </div>
        }
      >
        <ProfilePageContent
          user={user}
          isOwnProfile={isOwnProfile}
          showGuestBanner={showGuestBanner}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("[Server] Error rendering profile page:", error);
    // Redirect to login on error
    return redirect("/auth?callbackUrl=/me");
  }
}
