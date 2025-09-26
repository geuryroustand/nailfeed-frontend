import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
  ProfileGallerySkeleton,
} from "@/components/profile/profile-skeleton"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"

export default function Loading() {
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
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <ProfileHeaderSkeleton />
              <ProfileStatsSkeleton />
              <ProfileGallerySkeleton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="profile" />
      </div>
    </main>
  )
}