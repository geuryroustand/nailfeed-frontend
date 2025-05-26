import type React from "react"

interface Post {
  id: string
  imageUrl?: string
  image?: any
  media?: any
  images?: any
  // Add other post properties as needed
}

interface PostFeedProps {
  posts: Post[]
}

const Post: React.FC<{ post: Post }> = ({ post }) => {
  return (
    <div>
      {/* Display post content here */}
      <p>Post ID: {post.id}</p>
      {post.imageUrl && <img src={post.imageUrl || "/placeholder.svg"} alt="Post" />}
    </div>
  )
}

const PostFeed: React.FC<PostFeedProps> = ({ posts }) => {
  return (
    <div>
      {posts.map((post, index) => {
        console.log(`PostFeed - Rendering post ${index}:`, {
          postId: post.id,
          imageUrl: post.imageUrl,
          image: post.image,
          media: post.media,
          images: post.images,
        })

        return <Post key={post.id} post={post} />
      })}
    </div>
  )
}

export default PostFeed
