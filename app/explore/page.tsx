import ExploreHeader from "@/components/explore/explore-header"
import ExploreGrid from "@/components/explore/explore-grid"
import ExploreTrending from "@/components/explore/explore-trending"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Sidebar activeItem="explore" />
        </div>

        {/* Main Content */}
        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-7xl mx-auto px-4 pt-2 pb-16 md:py-8">
            <ExploreHeader />
            <ExploreTrending />
            <Suspense
              fallback={
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading explore content...</p>
                  </div>
                </div>
              }
            >
              <ExploreGrid />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="search" />
      </div>

      <Toaster />
    </main>
  )
}

export const dynamic = "force-dynamic"
export const revalidate = 0
