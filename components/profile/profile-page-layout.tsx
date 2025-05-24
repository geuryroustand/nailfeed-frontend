import type React from "react"
import { Suspense } from "react"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import GuestModeBanner from "@/components/profile/guest-mode-banner"
import CreatePostButton from "@/components/profile/create-post-button"

interface ProfilePageLayoutProps {
  children: React.ReactNode
  isOwnProfile: boolean
  showGuestBanner?: boolean
}

export function ProfilePageLayout({ children, isOwnProfile, showGuestBanner = false }: ProfilePageLayoutProps) {
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
            {/* Guest Banner */}
            {showGuestBanner && (
              <Suspense fallback={null}>
                <GuestModeBanner />
              </Suspense>
            )}

            {/* Create Post Button - Only show on own profile */}
            {isOwnProfile && (
              <div className="flex justify-center my-4">
                <Suspense fallback={null}>
                  <CreatePostButton />
                </Suspense>
              </div>
            )}

            {/* Main Content */}
            {children}
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
          <Suspense fallback={null}>
            <CreatePostButton size="lg" showLabel={false} className="h-14 w-14" />
          </Suspense>
        </div>
      )}

      <Toaster />
    </main>
  )
}

export default ProfilePageLayout
