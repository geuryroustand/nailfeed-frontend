import { Suspense } from "react"
import StructuredData from "./post/structured-data"
import type { Post } from "@/lib/post-data"
import PostDetailSkeleton from "./post-detail-skeleton"
import PostDetailClientWrapper from "./post-detail-client-wrapper"

interface PostDetailServerProps {
  post: Post
  relatedPosts?: Post[]
}

export default function PostDetailServer({ post, relatedPosts = [] }: PostDetailServerProps) {
  // Generate the post URL for structured data
  const postUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/post/${post.documentId || post.id}`

  // Ensure the post has a documentId for comment functionality
  const postWithDocumentId = {
    ...post,
    documentId: post.documentId || `post-${post.id}`,
  }

  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      {/* Add structured data for SEO */}
      <StructuredData post={post} url={postUrl} />

      {/* Use the client wrapper for interactive elements */}
      <PostDetailClientWrapper post={postWithDocumentId} relatedPosts={relatedPosts} />
    </Suspense>
  )
}
