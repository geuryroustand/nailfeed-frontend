import { Skeleton } from "@/components/ui/skeleton"

export default function PostDetailSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center">
        <Skeleton className="h-10 w-10 rounded-full mr-3" />
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="w-full aspect-square" />
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="border-t pt-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4 mb-4">
            <div className="flex items-start">
              <Skeleton className="h-8 w-8 rounded-full mr-2" />
              <div className="flex-1">
                <Skeleton className="h-20 w-full rounded-lg mb-1" />
                <div className="flex items-center mt-1">
                  <Skeleton className="h-3 w-8 mr-3" />
                  <Skeleton className="h-3 w-8 mr-3" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
