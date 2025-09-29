"use client"

import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { getPosts } from "@/lib/post-data"
import PostFeedOptimized from "./post-feed/post-feed-optimized"
import PostFeedSkeleton from "./post-feed/post-feed-skeleton"
import { FEATURES, PAGINATION } from "@/lib/config"

// Error fallback component
function PostFeedErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <h3 className="text-red-800 font-medium mb-2">Something went wrong</h3>
      <p className="text-red-600 text-sm mb-4">We couldn't load the posts. Please try again.</p>
      <button
        onClick={resetErrorBoundary}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

export default async function PostFeedServerEnhanced() {
  try {
    // Fetch initial posts with optimized limit for better UX
    const { posts, hasMore, nextPage, error } = await getPosts(PAGINATION.INITIAL_POST_LIMIT, 0)

    // Handle API errors with fallback data
    if (error && posts.length > 0 && FEATURES.useFallbackData) {
      return (
        <ErrorBoundary FallbackComponent={PostFeedErrorFallback}>
          <Suspense fallback={<PostFeedSkeleton />}>
            <PostFeedOptimized
              initialPosts={posts}
              initialHasMore={false}
              initialNextPage={undefined}
              initialError={{
                code: error.code,
                message: error.message,
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )
    }

    // Handle API errors without fallback data
    if (error) {
      return (
        <ErrorBoundary FallbackComponent={PostFeedErrorFallback}>
          <Suspense fallback={<PostFeedSkeleton />}>
            <PostFeedOptimized
              initialPosts={[]}
              initialHasMore={true}
              initialNextPage={1}
              initialError={{
                code: error.code,
                message: error.message,
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )
    }

    // Success case
    return (
      <ErrorBoundary FallbackComponent={PostFeedErrorFallback}>
        <Suspense fallback={<PostFeedSkeleton />}>
          <PostFeedOptimized
            initialPosts={posts}
            initialHasMore={hasMore}
            initialNextPage={nextPage}
            initialError={error}
          />
        </Suspense>
      </ErrorBoundary>
    )
  } catch (error) {
    // Server-side error handling
    return (
      <ErrorBoundary FallbackComponent={PostFeedErrorFallback}>
        <Suspense fallback={<PostFeedSkeleton />}>
          <PostFeedOptimized
            initialPosts={[]}
            initialHasMore={false}
            initialNextPage={undefined}
            initialError={{
              code: "SERVER_ERROR",
              message: "Failed to load posts on server. Retrying on client.",
            }}
          />
        </Suspense>
      </ErrorBoundary>
    )
  }
}
