import PostDetailSkeleton from "@/components/post-detail-skeleton"

export default function PostLoading() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <PostDetailSkeleton />
    </div>
  )
}
