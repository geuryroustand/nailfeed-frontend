import type React from "react"
import { Suspense } from "react"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import GuestModeBanner from "@/components/profile/guest-mode-banner"

interface ProfilePageLayoutEnhancedProps {
  children: React.ReactNode
  isOwnProfile: boolean
  showGuestBanner?: boolean
  username?: string
}

export function ProfilePageLayoutEnhanced({
  children,
  isOwnProfile,
  showGuestBanner = false,
  username,
}: ProfilePageLayoutEnhancedProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar - Server Component */}
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Suspense fallback={<SidebarSkeleton />}>
            <Sidebar activeItem="profile" />
          </Suspense>
        </div>

        {/* Main Content */}
        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-4xl mx-auto px-4 pt-2 pb-16 md:py-8">
            {/* Guest Banner - Only for unauthenticated users */}
            {showGuestBanner && (
              <Suspense fallback={null}>
                <GuestModeBanner />
              </Suspense>
            )}

            {/* Main Profile Content */}
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <Suspense fallback={<BottomNavSkeleton />}>
          <BottomNav activeTab="profile" />
        </Suspense>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </main>
  )
}

function SidebarSkeleton() {
  return (
    <div className="h-full bg-white border-r border-gray-200 p-4 animate-pulse">
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="h-6 w-6 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function BottomNavSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 animate-pulse">
      <div className="flex justify-around">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-8 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}
