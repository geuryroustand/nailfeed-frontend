import type React from "react"
import type { Post } from "@/types/post"
import FeedCommentSection from "@/components/comments/feed-comment-section"

interface PostDetailViewEnhancedProps {
  post: Post
  documentId?: string
}

const PostDetailViewEnhanced: React.FC<PostDetailViewEnhancedProps> = ({ post, documentId }) => {
  return (
    <div>
      {/* Post Content - Replace with actual content rendering */}
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      <div className="mt-6 border-t pt-6">
        <FeedCommentSection postId={post.id} documentId={documentId || post.documentId} allowViewingForAll={true} />
      </div>
    </div>
  )
}

export default PostDetailViewEnhanced
