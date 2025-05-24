"use client"

import type React from "react"
import { useState } from "react"

interface PostDetailCommentsProps {
  postId: string
}

const PostDetailComments: React.FC<PostDetailCommentsProps> = ({ postId }) => {
  const [comments, setComments] = useState<string[]>([])
  const [newComment, setNewComment] = useState("")

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate submitting a comment to a backend
    // In a real application, you would send this to an API
    const newCommentList = [...comments, newComment]
    setComments(newCommentList)
    setNewComment("")

    // Optimistically update the UI
    console.log("Comment submitted:", newComment)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
  }

  return (
    <div>
      <h3>Comments</h3>
      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <ul>
          {comments.map((comment, index) => (
            <li key={index}>{comment}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCommentSubmit}>
        <textarea value={newComment} onChange={handleInputChange} placeholder="Add a comment..." />
        <button type="submit">Submit Comment</button>
      </form>
    </div>
  )
}

export default PostDetailComments
