import { notFound } from "next/navigation";
import { fetchProfileData } from "@/lib/actions/profile-server-actions";
import { ProfilePageContentOptimized } from "@/components/profile/profile-page-content-optimized";
import FollowLists from "@/components/profile/follow-lists";
import { cookies } from "next/headers";

// Set dynamic to force-dynamic to ensure we always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserProfilePageOptimized({
  params,
}: {
  params: { username: string };
}) {
  try {
    // Get the username from the URL params
    const username = params.username;

    if (!username) {
      console.error("No username provided in URL params");
      return notFound();
    }

    console.log(`Rendering optimized profile page for username: ${username}`);

    // Use the server action to get profile data
    const profileData = await fetchProfileData(username);

    // Handle error case
    if ("error" in profileData) {
      console.error(`Error rendering user profile page: ${profileData.error}`);
      return notFound();
    }

    // Handle not found case
    if ("notFound" in profileData) {
      console.log(`User not found: ${username}`);
      return notFound();
    }

    // We have valid profile data, render the profile page
    const { user } = profileData;

    // Validate that we have a user object with required fields
    if (!user || !user.username) {
      console.error("Invalid user data returned from API");
      return notFound();
    }

    // Check if this is the user's own profile
    const cookieStore = await cookies();
    const currentUsername = cookieStore.get("username")?.value;
    const isOwnProfile = currentUsername === username;

    // For consistency with the /profile route, show guest banner if this is the user's own profile and they're not confirmed
    const showGuestBanner = isOwnProfile && !user.confirmed;

    // Extract followers and following from profileData if available
    const followers =
      "followers" in profileData ? profileData.followers ?? [] : [];
    const following =
      "following" in profileData ? profileData.following ?? [] : [];

    return (
      <>
        <ProfilePageContentOptimized
          user={user}
          isOwnProfile={isOwnProfile}
          showGuestBanner={showGuestBanner}
        />

        <div className="mb-12 px-4">
          <FollowLists username={username} isOwnProfile={isOwnProfile} />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error rendering user profile page:", error);
    return notFound();
  }
}
