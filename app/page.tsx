import { Suspense } from "react"
import FeaturedStories from "@/components/featured-stories"
import PostFeedServer from "@/components/post-feed-server"
import BottomNav from "@/components/bottom-nav"
import Sidebar from "@/components/sidebar"
import TrendingSection from "@/components/trending-section"
import { Toaster } from "@/components/ui/toaster"
import AuthCTA from "@/components/auth-cta"
import TestimonialCarousel from "@/components/testimonial-carousel"
import AdvancedSearch from "@/components/search/advanced-search"
import SearchResults from "@/components/search/search-results"
import { SearchProvider } from "@/context/search-context"
import ErrorBoundaryWrapper from "@/components/error-boundary-wrapper"

// Loading fallbacks
const LoadingFallback = () => <div className="animate-pulse h-64 bg-gray-200 rounded-xl"></div>

export const dynamic = "force-dynamic"
export const revalidate = 0


export default function HomePage() {
  // We'll determine authentication status on the server in a real app
  const isAuthenticated = false

  return (
    <ErrorBoundaryWrapper>
      <SearchProvider>
        <main className="min-h-screen bg-gray-50">
          <div className="flex">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
              <Sidebar activeItem="home" />
            </div>

            {/* Main Content - adjusted for desktop */}
            <div className="w-full md:pl-64 lg:pl-72">
              <div className="container max-w-5xl mx-auto px-4 pt-2 pb-16 md:py-8">
                <div className="mb-6">
                  <Suspense fallback={<LoadingFallback />}>
                    <AdvancedSearch />
                  </Suspense>
                </div>

                <Suspense fallback={<LoadingFallback />}>
                  <SearchResults />
                </Suspense>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left column - Featured and Feed */}
                  <div className="lg:col-span-2 space-y-6">
                    {!isAuthenticated && (
                      <Suspense fallback={<LoadingFallback />}>
                        <AuthCTA />
                      </Suspense>
                    )}

                    <Suspense fallback={<LoadingFallback />}>
                      <FeaturedStories />
                    </Suspense>

                    <Suspense fallback={<LoadingFallback />}>
                      <PostFeedServer />
                    </Suspense>
                  </div>

                  {/* Right column - Trending and Testimonials */}
                  <div className="hidden lg:block">
                    <div className="sticky top-8 space-y-6">
                      {!isAuthenticated && (
                        <Suspense fallback={<LoadingFallback />}>
                          <TestimonialCarousel />
                        </Suspense>
                      )}

                      <Suspense fallback={<LoadingFallback />}>
                        <TrendingSection />
                      </Suspense>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Nav - visible on mobile only */}
          <div className="md:hidden">
            <BottomNav activeTab="home" />
          </div>

          <Toaster />
        </main>
      </SearchProvider>
    </ErrorBoundaryWrapper>
  )
}


