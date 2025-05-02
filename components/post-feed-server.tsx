import { getPosts } from "@/lib/post-data"
import PostFeed from "@/components/post-feed"
import { Suspense } from "react"
import SampleDataNotice from "@/components/sample-data-notice"

export default async function PostFeedServer() {
  try {
    console.log("PostFeedServer: Fetching posts")

    // Fetch initial posts from the server with a smaller batch size to reduce rate limiting
    // Using an even smaller batch size (1) to minimize API pressure
    const { posts, nextCursor, hasMore } = await getPosts(1, 0)

    console.log(`PostFeedServer: Fetched ${posts.length} posts`)

    // Check if we're using sample data
    const usingSampleData = process.env.USE_SAMPLE_DATA === "true"

    return (
      <Suspense fallback={<PostFeedSkeleton />}>
        {usingSampleData && <SampleDataNotice />}
        <PostFeed initialPosts={posts} initialNextCursor={nextCursor} initialHasMore={hasMore} />
      </Suspense>
    )
  } catch (error) {
    console.error("Error in PostFeedServer:", error)

    let errorMessage = "We're experiencing technical difficulties. Using fallback data."

    // Check if it's a rate limit error
    if (error instanceof Error && (error.message.includes("Too Many Requests") || error.message.includes("429"))) {
      errorMessage = "API rate limit exceeded. Using fallback data until the limit resets."
    }

    // If there's an error, return the PostFeed with fallback data
    // and a message about the issue
    return (
      <div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{errorMessage}</p>
            </div>
          </div>
        </div>
        <SampleDataNotice />
        <PostFeed initialPosts={[]} initialNextCursor={null} initialHasMore={false} />
      </div>
    )
  }
}

function PostFeedSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}
