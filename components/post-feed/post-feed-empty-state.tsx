"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface PostFeedEmptyStateProps {
  isLoading: boolean
  onRetry: () => void
}

export default function PostFeedEmptyState({ isLoading, onRetry }: PostFeedEmptyStateProps) {
  return (
    <div className="p-8 text-center">
      <p className="text-gray-500">No posts found. Create your first post or check back later!</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry} disabled={isLoading}>
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </>
        )}
      </Button>
    </div>
  )
}
