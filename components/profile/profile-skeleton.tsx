import { Skeleton } from "@/components/ui/skeleton"

export function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Cover Image Skeleton */}
      <div className="h-40 md:h-60 bg-gray-200 relative overflow-hidden">
        {/* Action buttons skeleton */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Avatar Skeleton - positioned to overlap the cover image */}
      <div className="flex justify-center -mt-16 md:-mt-20">
        <div className="rounded-full p-1 bg-white shadow-lg">
          <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-full" />
        </div>
      </div>

      {/* Spacer for avatar overflow */}
      <div className="h-16 md:h-20"></div>

      {/* User Info Skeleton */}
      <div className="text-center px-4 pb-6">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto mb-4" />

        {/* Follower and Following Counts Skeleton */}
        <div className="flex justify-center gap-6 mt-3">
          <div className="text-center">
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="mt-4 max-w-md mx-auto">
          <Skeleton className="h-4 w-full max-w-xs mx-auto mb-2" />
          <Skeleton className="h-4 w-3/4 max-w-xs mx-auto mb-2" />
          <Skeleton className="h-4 w-1/2 max-w-xs mx-auto" />
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function ProfileStatsSkeleton() {
  return (
    <div className="p-4 border-t border-gray-100 animate-pulse">
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  )
}

export function ProfileGallerySkeleton() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-24" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function FollowListsSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex justify-center space-x-4 mb-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-10 w-1/2" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="ml-auto">
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
