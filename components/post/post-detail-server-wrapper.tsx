import { Suspense } from "react"
import { trackPostView } from "@/lib/actions/post-detail-actions"
import PostDetailHeader from "./post-detail-header"
import PostDetailContent from "./post-detail-content"
import PostDetailActionsWrapper from "./post-detail-actions-wrapper"
import PostDetailComments from "./post-detail-comments"
import PostDetailRelated from "./post-detail-related"
import StructuredData from "./structured-data"
import type { Post } from "@/lib/post-data"

interface PostDetailServerWrapperProps {
  post: Post
  relatedPosts: Post[]
}

export default async function PostDetailServerWrapper({ post, relatedPosts }: PostDetailServerWrapperProps) {
  // Generate the post URL for structured data
  const postUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/post/${post.documentId || post.id}`

  // Ensure the post has a documentId for comment functionality
  const postWithDocumentId = {
    ...post,
    documentId: post.documentId || `post-${post.id}`,
  }

  // Track post view (fire and forget)
  trackPostView(post.id).catch((error) => {
    console.error("Failed to track post view:", error)
  })

  return (
    <>
      {/* Add structured data for SEO */}
      <StructuredData post={post} url={postUrl} />

      <div className="max-w-4xl mx-auto">
        {/* Post Header */}
        <Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse mb-4" />}>
          <PostDetailHeader post={postWithDocumentId} />
        </Suspense>

        {/* Main Post Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse" />}>
            <PostDetailContent post={postWithDocumentId} />
          </Suspense>

          <Suspense fallback={<div className="h-16 bg-gray-50 animate-pulse" />}>
            <PostDetailActionsWrapper post={postWithDocumentId} />
          </Suspense>
        </div>

        {/* Comments Section */}
        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse mb-6" />}>
          <PostDetailComments postId={postWithDocumentId.id} documentId={postWithDocumentId.documentId} />
        </Suspense>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
            <PostDetailRelated posts={relatedPosts} />
          </Suspense>
        )}
      </div>
    </>
  )
}
