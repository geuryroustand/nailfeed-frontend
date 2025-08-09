import { Suspense } from "react"
import { getExplorePosts, getUserInteractions } from "@/lib/explore-data"
import ExploreGridClient from "./explore-grid-client"
import ExploreGridSkeleton from "./explore-grid-skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import SampleDataNotice from "@/components/sample-data-notice"
import { useSampleData } from "@/lib/config"

export default async function ExploreGrid() {
  const showSampleDataNotice = useSampleData()

  try {
    console.log("Fetching explore posts...")

    // Fetch initial data in parallel
    const [postsResponse, userInteractions] = await Promise.all([
      getExplorePosts(12, 1), // Fetch first page with 12 items
      getUserInteractions("current-user"),
    ])

    console.log(`Received ${postsResponse.data?.length || 0} posts from API`)

    // Check for API errors
    if (postsResponse.error) {
      console.error("API Error:", postsResponse.error)
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription>
            {postsResponse.error.message || "Failed to load posts from API"}
            {postsResponse.error.code ? ` (${postsResponse.error.code})` : ""}
          </AlertDescription>
        </Alert>
      )
    }

    // Check if we have posts
    if (!postsResponse.data || postsResponse.data.length === 0) {
      return (
        <div className="space-y-4">
          {showSampleDataNotice && <SampleDataNotice />}
          <Alert className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Posts Found</AlertTitle>
            <AlertDescription>
              No posts are currently available in the explore feed. Please check back later.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Combine posts with user interaction data
    const postsWithInteractions = postsResponse.data.map((post) => ({
      ...post,
      isLiked: userInteractions.likedPostIds.includes(post.id),
      isSaved: userInteractions.savedPostIds.includes(post.id),
    }))

    return (
      <div className="space-y-4">
        {showSampleDataNotice && <SampleDataNotice />}
        <Suspense fallback={<ExploreGridSkeleton />}>
          <ExploreGridClient
            initialPosts={postsWithInteractions}
            initialNextCursor={postsResponse.nextCursor}
            initialHasMore={postsResponse.hasMore}
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Error loading explore grid:", error)
    return (
      <div className="space-y-4">
        {showSampleDataNotice && <SampleDataNotice />}
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load explore content. Please try again later.
            {error instanceof Error ? ` Error: ${error.message}` : ""}
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}
