"use client"

import type React from "react"

interface PostDetailContentProps {
  title: string
  content: string
}

const PostDetailContent: React.FC<PostDetailContentProps> = ({ title, content }) => {
  return (
    <div className="post-detail-content">
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

export default PostDetailContent
