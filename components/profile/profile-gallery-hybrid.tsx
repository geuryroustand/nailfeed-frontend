"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ProfileGalleryClient } from "./profile-gallery-client"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { fetchUserPostsClient } from "@/lib/services/profile-posts-client-service"
import { processPostsForGallery } from "@/lib/post-data-processors"

interface ProfileGalleryHybridProps {
  documentId: string
  username: string
  initialPosts: any[]
  initialPostsCount: number
}

export function ProfileGalleryHybrid({
  documentId,
  username,
  initialPosts,
  initialPostsCount
}: ProfileGalleryHybridProps) {
  // Use server posts as initial data (eliminates initial loading)
  const [posts, setPosts] = useState(() => processPostsForGallery(initialPosts))
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length > 0 && initialPosts.length >= 10)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(2) // Start from page 2 since page 1 is already loaded
  const [total, setTotal] = useState(initialPostsCount)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  console.log("[ProfileGalleryHybrid] Status:", {
    documentId,
    username,
    isLoading: false, // Never loading initially thanks to server data
    isLoadingMore,
    hasMore,
    postsCount: posts.length,
    total,
    error
  })

  // Load more posts function
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setError(null)

    try {
      const result = await fetchUserPostsClient(documentId, currentPage, 10)

      if ("error" in result) {
        setError(result.message)
        return
      }

      const newPosts = processPostsForGallery(result.posts)

      setPosts(prev => [...prev, ...newPosts])
      setHasMore(result.posts.length === 10) // If we got less than 10, no more pages
      setCurrentPage(prev => prev + 1)
      setTotal(result.totalCount || total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more posts")
    } finally {
      setIsLoadingMore(false)
    }
  }, [documentId, currentPage, isLoadingMore, hasMore, total])

  // Refresh function (reload from server)
  const refresh = useCallback(async () => {
    window.location.reload() // Simple refresh to get latest server data
  }, [])

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

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={() => {
            setError(null)
            loadMore()
          }}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Gallery component - no initial loading since we have server data */}
      <ProfileGalleryClient
        posts={posts}
        username={username}
        isLoading={false} // Never loading initially
        total={total}
      />

      {/* Load more section */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="text-center py-8"
        >
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more posts...</span>
            </div>
          ) : (
            <Button
              onClick={loadMore}
              variant="outline"
              disabled={isLoadingMore}
            >
              Load More Posts
            </Button>
          )}
        </div>
      )}

      {/* End message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've seen all posts</p>
        </div>
      )}

      {/* No posts message */}
      {posts.length === 0 && !isLoadingMore && (
        <div className="text-center py-8 text-gray-500">
          <p>No posts yet</p>
        </div>
      )}
    </>
  )
}
