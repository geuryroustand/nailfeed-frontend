import PostDetailSkeleton from "@/components/post-detail-skeleton"

export default function PostLoading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <PostDetailSkeleton />
    </div>
  )
}
