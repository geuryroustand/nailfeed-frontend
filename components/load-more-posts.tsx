"use client"

import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

interface LoadMorePostsProps {
  onLoadMore: () => void
  hasMore?: boolean
  isLoading: boolean
}

export default function LoadMorePosts({ onLoadMore, hasMore = false, isLoading }: LoadMorePostsProps) {
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observerElement = observerRef.current

    if (!observerElement || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      { threshold: 1.0 },
    )

    observer.observe(observerElement)

    return () => {
      if (observerElement) {
        observer.unobserve(observerElement)
      }
    }
  }, [onLoadMore, hasMore, isLoading])

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
