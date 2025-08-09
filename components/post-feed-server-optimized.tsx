import { Suspense } from "react"
import { getPosts } from "@/lib/post-data"
import PostFeedOptimized from "./post-feed-optimized"
import { FEATURES } from "@/lib/config"

export default async function PostFeedServerOptimized() {
  try {
    // Fetch initial posts on the server with a smaller limit to reduce chance of rate limiting
    const { posts, hasMore, nextPage, error } = await getPosts(5, 0)

    // If we hit an error but have fallback posts, still show them
    if (error && posts.length > 0 && FEATURES.useFallbackData) {
      // API error occurred, but using fallback data
      return (
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
      )
    }

    // If we hit an error with no posts, let the client component handle it
    if (error) {
      // API error occurred
      return (
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
      )
    }

    return (
      <Suspense fallback={<PostFeedSkeleton />}>
        <PostFeedOptimized
          initialPosts={posts}
          initialHasMore={hasMore}
          initialNextPage={nextPage}
          initialError={error}
        />
      </Suspense>
    )
  } catch (error) {
    // Error occurred in PostFeedServer component
    // Return the PostFeed without initial data, it will handle loading on the client
    return (
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
    )
  }
}

function PostFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
      ))}
    </div>
  )
}
