"use client"

import { useInfinitePosts } from "@/hooks/use-infinite-posts"
import { ProfileGalleryClient } from "./profile-gallery-client"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { useEffect, useRef } from "react"
import { processPostsForGallery } from "@/lib/post-data-processors"

interface ProfileGalleryInfiniteProps {
  documentId: string
  username: string
  initialPostsCount: number
}

export function ProfileGalleryInfinite({
  documentId,
  username,
  initialPostsCount
}: ProfileGalleryInfiniteProps) {
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    total,
    loadMore,
    refresh
  } = useInfinitePosts(documentId, 10)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Auto-load more when scrolling near the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  // Process posts for the gallery client
  const processedPosts = processPostsForGallery(posts)

  console.log(`[ProfileGalleryInfinite] Status:`, {
    documentId,
    username,
    isLoading,
    isLoadingMore,
    hasMore,
    postsCount: posts.length,
    total,
    error
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-4" />
        <p className="text-gray-500">Loading posts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">Failed to load posts: {error}</p>
        <Button
          onClick={refresh}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts to display</p>
        </div>
      ) : (
        <>
          <ProfileGalleryClient posts={processedPosts} username={username} />

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="mt-8">
            {isLoadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more posts...</span>
                </div>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="flex justify-center py-8">
                <p className="text-gray-500 text-sm">
                  You've reached the end of the posts
                </p>
              </div>
            )}

            {hasMore && !isLoadingMore && (
              <div className="flex justify-center py-8">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Load More Posts
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}