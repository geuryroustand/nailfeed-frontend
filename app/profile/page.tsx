import { Suspense } from "react";
import { requireAuth } from "@/app/actions/user-actions";
import ProfileHeader from "@/components/profile/profile-header";
import ProfileGallery from "@/components/profile/profile-gallery";
import ProfileStats from "@/components/profile/profile-stats";
import Sidebar from "@/components/sidebar";
import BottomNav from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/toaster";
import GuestModeBanner from "@/components/profile/guest-mode-banner";
import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
} from "@/components/profile/profile-skeleton";

// Mark this page as dynamic
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  try {
    // This will redirect to /auth if not authenticated
    console.log("Fetching user data for profile page");
    const user = await requireAuth("/profile");
    console.log("User data fetched successfully");

    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Desktop Sidebar - hidden on mobile */}
          <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
            <Sidebar activeItem="profile" />
          </div>

          {/* Main Content */}
          <div className="w-full md:pl-64 lg:pl-72">
            <div className="container max-w-4xl mx-auto px-4 pt-2 pb-16 md:py-8">
              {!user.confirmed && <GuestModeBanner />}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <Suspense fallback={<ProfileHeaderSkeleton />}>
                  <ProfileHeader user={user} />
                </Suspense>

                <Suspense fallback={<ProfileStatsSkeleton />}>
                  <ProfileStats user={user} />
                </Suspense>

                <Suspense
                  fallback={
                    <div className="p-8 text-center">Loading gallery...</div>
                  }
                >
                  <ProfileGallery username={user.username} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Nav - visible on mobile only */}
        <div className="md:hidden">
          <BottomNav activeTab="profile" />
        </div>

        <Toaster />
      </main>
    );
  } catch (error) {
    console.error("Error rendering profile page:", error);

    // Fallback UI for errors
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Profile
          </h1>
          <p className="text-gray-700 mb-6">
            We encountered an error while loading your profile. This could be
            due to network issues or server problems.
          </p>
          <div className="flex flex-col space-y-4">
            <a
              href="/auth"
              className="bg-blue-600 text-white py-2 px-4 rounded-md text-center hover:bg-blue-700 transition-colors"
            >
              Sign In Again
            </a>
            <a
              href="/"
              className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-center hover:bg-gray-50 transition-colors"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </main>
    );
  }
}
