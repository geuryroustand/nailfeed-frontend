import { Skeleton } from "@/components/ui/skeleton"

export function ExploreHeaderSkeleton() {
  return (
    <div className="sticky top-0 z-40 bg-gray-50 pt-4 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center flex-1">
          <div className="md:max-w-md w-full">
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="hidden md:block">
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>
    </div>
  )
}

export function ExploreTrendingSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExploreGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square">
          <Skeleton className="h-full w-full" />
        </div>
      ))}
    </div>
  )
}
