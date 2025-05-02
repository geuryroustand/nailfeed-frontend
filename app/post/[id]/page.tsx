import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getPostById } from "@/lib/post-data"
import PostDetailView from "@/components/post-detail-view"
import PostDetailSkeleton from "@/components/post-detail-skeleton"
import { ReactionDetails } from "@/components/reaction-details"

interface PostPageProps {
  params: {
    id: string
  }
}

export default async function PostPage({ params }: PostPageProps) {
  try {
    // The id param could be either a numeric ID or a documentId
    const idOrDocumentId = params.id

    // Fetch the post data using either ID or documentId
    const post = await getPostById(idOrDocumentId)

    // If post not found, show 404
    if (!post) {
      console.error(`Post not found with ID/documentId: ${idOrDocumentId}`)
      return notFound()
    }

    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Suspense fallback={<PostDetailSkeleton />}>
          <PostDetailView post={post} />
        </Suspense>
        {/* Add this after the PostDetailView component */}
        <div className="mt-4">
          <ReactionDetails postId={post.id} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error loading post:", error)
    return notFound()
  }
}
