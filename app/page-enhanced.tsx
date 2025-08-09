import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import FeaturedStories from "@/components/featured-stories"
import TrendingSection from "@/components/trending-section"
import TestimonialCarousel from "@/components/testimonial-carousel"
import PostFeedServerEnhanced from "@/components/post-feed-server-enhanced"
import AuthCTA from "@/components/auth-cta"
import AdvancedSearch from "@/components/search/advanced-search"
import SearchResults from "@/components/search/search-results"
import SearchProviderWrapper from "@/components/search-provider-wrapper"

// Loading skeletons
const SidebarSkeleton = () => <div className="animate-pulse h-screen bg-gray-200" />
const FeaturedStoriesSkeleton = () => <div className="animate-pulse h-32 bg-gray-200 rounded-xl" />
const TrendingSkeleton = () => <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />
const TestimonialSkeleton = () => <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />
const MainContentSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse h-12 bg-gray-200 rounded-xl" />
    <div className="animate-pulse h-32 bg-gray-200 rounded-xl" />
    <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />
  </div>
)

export default function HomePageEnhanced() {
  // Server-side authentication check would go here
  const isAuthenticated = false

  return (
    <SearchProviderWrapper>
      <main className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
            <Suspense fallback={<SidebarSkeleton />}>
              <Sidebar activeItem="home" />
            </Suspense>
          </div>

          {/* Main Content */}
          <div className="w-full md:pl-64 lg:pl-72">
            <div className="container max-w-5xl mx-auto px-4 pt-2 pb-16 md:py-8">
              {/* Search - Critical for UX */}
              <div className="mb-6">
                <AdvancedSearch />
              </div>

              <SearchResults />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                  {!isAuthenticated && <AuthCTA />}

                  {/* Featured Stories - Non-critical */}
                  <Suspense fallback={<FeaturedStoriesSkeleton />}>
                    <FeaturedStories />
                  </Suspense>

                  {/* Post Feed - Critical content */}
                  <Suspense fallback={<MainContentSkeleton />}>
                    <PostFeedServerEnhanced />
                  </Suspense>
                </div>

                {/* Sidebar Content */}
                <div className="hidden lg:block">
                  <div className="sticky top-8 space-y-6">
                    {!isAuthenticated && (
                      <Suspense fallback={<TestimonialSkeleton />}>
                        <TestimonialCarousel />
                      </Suspense>
                    )}
                    <Suspense fallback={<TrendingSkeleton />}>
                      <TrendingSection />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <BottomNav activeTab="home" />
        </div>

        <Toaster />
      </main>
    </SearchProviderWrapper>
  )
}
