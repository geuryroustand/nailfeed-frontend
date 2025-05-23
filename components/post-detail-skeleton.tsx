import { Skeleton } from "@/components/ui/skeleton"

export default function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back navigation skeleton */}
      <div className="mb-4">
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Main post card skeleton */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Post header skeleton */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Post media skeleton */}
        <Skeleton className="w-full aspect-video" />

        {/* Post content skeleton */}
        <div className="p-4 sm:p-6">
          {/* Description skeleton */}
          <div className="mb-4 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-4/6" />
          </div>

          {/* Tags skeleton */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex items-center justify-between py-4 border-t border-b">
            <Skeleton className="h-10 w-full mr-2" />
            <Skeleton className="h-10 w-full mr-2" />
            <Skeleton className="h-10 w-full mr-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Reactions summary skeleton */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Comments section skeleton */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-4">
        <Skeleton className="h-6 w-32 mb-6" />

        {/* Comment form skeleton */}
        <div className="flex items-start mb-6">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <div className="flex-1">
            <Skeleton className="h-24 w-full mb-2 rounded-lg" />
            <div className="flex justify-end">
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>

        {/* Comments list skeleton */}
        <div className="space-y-5">
          {Array(3)
            .fill(null)
            .map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-9 w-9 rounded-full mr-2" />
                <div className="flex-1">
                  <Skeleton className="h-24 w-full rounded-lg mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Related posts skeleton */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[280px]">
                <Skeleton className="aspect-square rounded-lg mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
