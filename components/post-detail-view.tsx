import type React from "react"
import type { Post } from "@/types/post"
import FeedCommentSection from "@/components/comments/feed-comment-section"

interface PostDetailViewProps {
  post: Post
  documentId?: string
}

const PostDetailView: React.FC<PostDetailViewProps> = ({ post, documentId }) => {
  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <div className="mt-6 border-t pt-6">
        <FeedCommentSection postId={post.id} documentId={documentId || post.documentId} allowViewingForAll={true} />
      </div>
    </div>
  )
}

export default PostDetailView
