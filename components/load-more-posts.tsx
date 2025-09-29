"use client"

import { Loader2 } from "lucide-react"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"

interface LoadMorePostsProps {
  onLoadMore: () => void
  hasMore?: boolean
  isLoading: boolean
}

export default function LoadMorePosts({ onLoadMore, hasMore = false, isLoading }: LoadMorePostsProps) {
  const observerRef = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
  })

  return (
    <div ref={observerRef} className="w-full flex justify-center items-center py-8" aria-hidden="true">
      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500 mr-2" />
          <span className="text-sm text-gray-500">Loading more posts...</span>
        </div>
      )}

      {!isLoading && hasMore && <div className="h-8 w-full" />}

      {!hasMore && !isLoading && <p className="text-sm text-gray-500">No more posts to load</p>}
    </div>
  )
}
