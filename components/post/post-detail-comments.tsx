import { Suspense } from "react"
import FeedCommentSection from "@/components/comments/feed-comment-section"

interface PostDetailCommentsProps {
  postId: string | number
  documentId?: string
}

export default function PostDetailComments({ postId, documentId }: PostDetailCommentsProps) {
  return (
    <div id="comments-section" className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4">Comments</h2>

      <Suspense
        fallback={
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="h-20 bg-gray-100 rounded-lg w-full" />
                  <div className="h-4 bg-gray-100 rounded w-24 mt-2" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <FeedCommentSection
          postId={postId}
          documentId={documentId}
          allowViewingForAll={true}
          onCommentAdded={() => {
            // Optional callback for when comments are added
          }}
        />
      </Suspense>
    </div>
  )
}
