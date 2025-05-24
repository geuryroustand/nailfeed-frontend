import dynamic from "next/dynamic"
import ErrorBoundaryWrapper from "@/components/error-boundary-wrapper"
import HomePageEnhanced from "./page-enhanced"

// Code splitting for non-critical components
const FeaturedStories = dynamic(() => import("@/components/featured-stories"), {
  loading: () => <div className="animate-pulse h-32 bg-gray-200 rounded-xl" />,
  ssr: false, // Not critical for initial render
})

const TrendingSection = dynamic(() => import("@/components/trending-section"), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />,
  ssr: false, // Not critical for initial render
})

const TestimonialCarousel = dynamic(() => import("@/components/testimonial-carousel"), {
  loading: () => <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />,
  ssr: false, // Not critical for initial render
})

// Loading fallbacks
const PostFeedSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse h-64 bg-gray-200 rounded-xl" />
    ))}
  </div>
)

const SidebarSkeleton = () => <div className="animate-pulse h-screen bg-gray-200" />

export default function HomePage() {
  return (
    <ErrorBoundaryWrapper>
      <HomePageEnhanced />
    </ErrorBoundaryWrapper>
  )
}
