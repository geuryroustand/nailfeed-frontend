import { Skeleton } from "@/components/ui/skeleton"

interface UserRecommendationsSkeletonProps {
  compact?: boolean
}

export default function UserRecommendationsSkeleton({ compact = false }: UserRecommendationsSkeletonProps) {
  return (
    <div className={compact ? "" : "bg-white rounded-lg shadow-sm p-4 mb-6"}>
      {!compact && <Skeleton className="h-5 w-40 mb-3" />}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className={compact ? "h-8 w-8 rounded-full" : "h-10 w-10 rounded-full"} />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
