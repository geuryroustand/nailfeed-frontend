import { Suspense } from "react"
import type { Metadata } from "next"
import ExploreHeaderServer from "@/components/explore/explore-header-server"
import ExploreTrendingServer from "@/components/explore/explore-trending-server"
import ExploreGridServer from "@/components/explore/explore-grid-server"
import ExploreLayout from "@/components/explore/explore-layout"
import {
  ExploreHeaderSkeleton,
  ExploreTrendingSkeleton,
  ExploreGridSkeleton,
} from "@/components/explore/explore-skeletons"
import { getExploreMetadata } from "@/lib/actions/explore-server-actions"

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getExploreMetadata()
  return metadata
}

interface ExplorePageProps {
  searchParams: {
    q?: string
    category?: string
    page?: string
  }
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const query = searchParams.q || ""
  const category = searchParams.category || "all"
  const page = Number.parseInt(searchParams.page || "1", 10)

  return (
    <ExploreLayout>
      {/* Header with search and categories */}
      <Suspense fallback={<ExploreHeaderSkeleton />}>
        <ExploreHeaderServer initialQuery={query} initialCategory={category} />
      </Suspense>

      {/* Trending section */}
      <Suspense fallback={<ExploreTrendingSkeleton />}>
        <ExploreTrendingServer />
      </Suspense>

      {/* Main content grid */}
      <Suspense fallback={<ExploreGridSkeleton />}>
        <ExploreGridServer query={query} category={category} initialPage={page} />
      </Suspense>
    </ExploreLayout>
  )
}

export const dynamic = "force-dynamic"
export const revalidate = 300 // 5 minutes
