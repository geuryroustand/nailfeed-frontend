import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"

export default function PostLoading() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <div className="mb-4">
          <div className="inline-flex items-center text-gray-400">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to feed</span>
          </div>
        </div>

        {/* Main post card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Post header */}
          <div className="p-4 sm:p-6 border-b">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </div>
            </div>
          </div>

          {/* Post media */}
          <div className="border-b">
            <Skeleton className="w-full aspect-square sm:aspect-video max-h-[600px]" />
          </div>

          {/* Post content */}
          <div className="p-4 sm:p-6">
            {/* Description */}
            <div className="mb-4">
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2" />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between py-4 border-t border-b mt-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className="mb-8">
          <Skeleton className="h-10 w-40 mb-4" />
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Related posts */}
        <div className="mt-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg">
                  <Skeleton className="w-full aspect-square" />
                  <div className="p-2">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
