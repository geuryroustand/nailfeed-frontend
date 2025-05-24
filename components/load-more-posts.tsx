"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LoadMorePostsProps {
  onClick: () => void
  loading: boolean
}

export function LoadMorePosts({ onClick, loading }: LoadMorePostsProps) {
  return (
    <div className="flex justify-center my-6">
      <Button
        variant="outline"
        size="lg"
        onClick={onClick}
        disabled={loading}
        className="w-full max-w-xs border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "Load More"
        )}
      </Button>
    </div>
  )
}
