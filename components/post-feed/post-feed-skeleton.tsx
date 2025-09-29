"use client"

import { memo } from "react"

interface PostSkeletonProps {
  viewMode?: "cards" | "compact"
}

const PostSkeleton = memo(function PostSkeleton({ viewMode = "cards" }: PostSkeletonProps) {
  if (viewMode === "compact") {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 mx-4">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="ml-2 space-y-1">
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-2 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-full h-3 bg-gray-200 rounded animate-pulse" />
              <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <div className="flex space-x-4">
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 mx-4">
      {/* Header skeleton */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {/* Avatar skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="ml-3 space-y-2">
              {/* Username skeleton */}
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              {/* Timestamp skeleton */}
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          {/* More options button skeleton */}
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Title skeleton (sometimes present) */}
      <div className="px-4">
        <div className="w-2/3 h-5 bg-gray-200 rounded animate-pulse mb-3" />
      </div>

      {/* Content skeleton - randomize between different content types */}
      <ContentSkeleton index={Math.random()} />

      {/* Reactions summary skeleton */}
      <div className="px-4 mt-3 mb-2">
        <div className="bg-gray-50 p-2 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {/* Reaction emojis placeholders */}
              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Like/Comment count skeleton */}
      <div className="px-4">
        <div className="flex items-center justify-between mt-3 pb-3 border-b">
          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Like button */}
          <div className="flex items-center justify-center flex-1">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse mr-2" />
            <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* Comment button */}
          <div className="flex items-center justify-center flex-1">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse mr-2" />
            <div className="w-14 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* Share button */}
          <div className="flex items-center justify-center flex-1">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse mr-2" />
            <div className="w-10 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* Try On button */}
          <div className="flex items-center justify-center flex-1">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse mr-2" />
            <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
})

// Separate component for content skeleton variations
const ContentSkeleton = memo(function ContentSkeleton({ index }: { index: number }) {
  const contentType = Math.floor(index * 10) % 4

  switch (contentType) {
    case 0: // Text post
      return (
        <div className="px-4 mb-3">
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-4/5 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-3/5 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )

    case 1: // Single image post
      return (
        <div>
          <div className="px-4 mb-3">
            <div className="space-y-2">
              <div className="w-4/5 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-3/5 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="mb-3">
            <div className="w-full h-64 bg-gray-200 animate-pulse" />
          </div>
        </div>
      )

    case 2: // Gallery post
      return (
        <div>
          <div className="px-4 mb-3">
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="mb-3 px-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      )

    case 3: // Text with background
    default:
      return (
        <div className="px-4 mb-3">
          <div className="bg-gray-200 rounded-lg p-6 animate-pulse">
            <div className="space-y-3">
              <div className="w-3/4 h-5 bg-gray-300 rounded mx-auto" />
              <div className="w-1/2 h-5 bg-gray-300 rounded mx-auto" />
            </div>
          </div>
        </div>
      )
  }
})

interface PostFeedSkeletonProps {
  count?: number
  viewMode?: "cards" | "compact"
}

export default function PostFeedSkeleton({
  count = 5,
  viewMode = "cards"
}: PostFeedSkeletonProps) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  )
}
