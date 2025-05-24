import type React from "react"

interface PostDetailHeaderProps {
  title: string
  author: string
  date: string
  imageUrl: string
}

const PostDetailHeader: React.FC<PostDetailHeaderProps> = ({ title, author, date, imageUrl }) => {
  return (
    <header className="post-detail-header">
      <img src={imageUrl || "/placeholder.svg"} alt={title} className="post-detail-header__image" />
      <div className="post-detail-header__content">
        <h1 className="post-detail-header__title">{title}</h1>
        <div className="post-detail-header__meta">
          <span className="post-detail-header__author">By {author}</span>
          <span className="post-detail-header__date">Published on {date}</span>
        </div>
        {/* Add any additional header content here, like social sharing buttons or follow buttons */}
      </div>
    </header>
  )
}

export default PostDetailHeader
