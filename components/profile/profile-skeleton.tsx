import { Skeleton } from "@/components/ui/skeleton"

export function ProfileHeaderSkeleton() {
  return (
    <>
      <div className="relative">
        {/* Cover Image Skeleton */}
        <div className="h-40 md:h-60 bg-gray-200 animate-pulse relative overflow-hidden">
          {/* Action buttons skeleton */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>

        {/* Avatar Skeleton - positioned to overlap the cover image */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16 md:-bottom-20">
          <div className="rounded-full p-1 bg-white shadow-lg">
            <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Spacer for avatar overflow */}
      <div className="h-16 md:h-20"></div>

      {/* User Info Skeleton */}
      <div className="text-center px-4 pb-6">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto mb-4" />

        <div className="mt-4 max-w-md mx-auto">
          <Skeleton className="h-16 w-full mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
    </>
  )
}

export function ProfileStatsSkeleton() {
  return (
    <div className="py-6 px-4 border-t border-b border-gray-100">
      <Skeleton className="h-6 w-40 mb-4" />

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      <div className="mt-6">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  )
}

export const ProfileGallerySkeleton = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="grid grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-md animate-pulse" />
          ))}
      </div>
    </div>
  )
}
