import { Suspense } from "react"
import { ProfileHeaderOptimized } from "@/components/profile/profile-header-optimized"
import ProfileGallery from "@/components/profile/profile-gallery"
import { ProfileStatsServer } from "@/components/profile/profile-stats-server"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import GuestModeBanner from "@/components/profile/guest-mode-banner"
import { ProfileHeaderSkeleton, ProfileStatsSkeleton } from "@/components/profile/profile-skeleton"
import type { UserProfileResponse } from "@/lib/services/user-service"
import CreatePostButton from "@/components/profile/create-post-button"

interface ProfilePageContentOptimizedProps {
  user: UserProfileResponse
  isOwnProfile: boolean
  showGuestBanner?: boolean
}

export function ProfilePageContentOptimized({
  user,
  isOwnProfile,
  showGuestBanner = false,
}: ProfilePageContentOptimizedProps) {
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
            {/* Only show guest banner for non-authenticated users */}
            {showGuestBanner && <GuestModeBanner />}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Suspense fallback={<ProfileHeaderSkeleton />}>
                <ProfileHeaderOptimized user={user} isOtherUser={!isOwnProfile} />
              </Suspense>

              <Suspense fallback={<ProfileStatsSkeleton />}>
                <ProfileStatsServer user={user} />
              </Suspense>

              {/* Create Post Button - Only show on own profile */}
              {isOwnProfile && (
                <div className="flex justify-center my-4">
                  <CreatePostButton />
                </div>
              )}

              <Suspense fallback={<div className="p-8 text-center">Loading gallery...</div>}>
                <ProfileGallery user={user} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="profile" />
      </div>

      {/* Floating Create Post Button for Mobile - Only show on own profile */}
      {isOwnProfile && (
        <div className="fixed bottom-20 right-4 md:hidden z-10">
          <CreatePostButton size="lg" showLabel={false} className="h-14 w-14" />
        </div>
      )}

      <Toaster />
    </main>
  )
}
