"use client"

import { Loader2 } from "lucide-react"

interface LoadMoreIndicatorProps {
  isLoading: boolean
}

export default function LoadMoreIndicator({ isLoading }: LoadMoreIndicatorProps) {
  return (
    <div className="flex justify-center items-center py-8">
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500">Loading more posts...</span>
        </div>
      ) : (
        <div className="h-8" /> // Empty space to maintain layout
      )}
    </div>
  )
}
