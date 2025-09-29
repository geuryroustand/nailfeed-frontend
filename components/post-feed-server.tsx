import { Suspense } from "react"
import { cookies } from "next/headers"
import { getPosts } from "@/lib/post-data"
import PostFeed from "./post-feed"
import PostFeedSkeleton from "./post-feed/post-feed-skeleton"
import { FEATURES, PAGINATION } from "@/lib/config"

export default async function PostFeedServer() {
  try {
    // For SSR, don't try to get user ID from cookies to avoid hydration mismatches
    // Let the client handle user-specific data loading after authentication
    const currentUserId = null;

    // Fetch initial posts on the server with optimized limit for better UX
    const { posts, hasMore, nextPage, error } = await getPosts(PAGINATION.INITIAL_POST_LIMIT, 0, currentUserId)

    // If we hit an error but have fallback posts, still show them
    if (error && posts.length > 0 && FEATURES.useFallbackData) {
      // API error occurred, but using fallback data
      return (
        <Suspense fallback={<PostFeedSkeleton />}>
          <PostFeed
            initialPosts={posts}
            initialHasMore={false}
            initialNextPage={undefined}
            initialError={{
              code: error.code,
              message: error.message,
            }}
          />
        </Suspense>
      )
    }

    // If we hit an error with no posts, let the client component handle it
    if (error) {
      // API error occurred
      return (
        <Suspense fallback={<PostFeedSkeleton />}>
          <PostFeed
            initialPosts={[]}
            initialHasMore={true}
            initialNextPage={1}
            initialError={{
              code: error.code,
              message: error.message,
            }}
          />
        </Suspense>
      )
    }

    return (
      <Suspense fallback={<PostFeedSkeleton />}>
        <PostFeed initialPosts={posts} initialHasMore={hasMore} initialNextPage={nextPage} initialError={error} />
      </Suspense>
    )
  } catch (error) {
    // Error occurred in PostFeedServer component
    // Return the PostFeed without initial data, it will handle loading on the client
    return (
      <Suspense fallback={<PostFeedSkeleton />}>
        <PostFeed
          initialPosts={[]}
          initialHasMore={false}
          initialNextPage={undefined}
          initialError={{
            code: "SERVER_ERROR",
            message: "Failed to load posts on server. Retrying on client.",
          }}
        />
      </Suspense>
    )
  }
}

