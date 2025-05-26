"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { Post } from "@/types"
import PostDetailModal from "@/components/post/post-detail-modal"

interface ExploreGridClientProps {
  posts: Post[]
}

const ExploreGridClient: React.FC<ExploreGridClientProps> = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    console.log("ExploreGrid - Initial posts:", posts)
  }, [posts])

  return (
    <div className="grid grid-cols-3 gap-4">
      {posts.map((post) => {
        console.log("ExploreGrid - Post data:", {
          postId: post.id,
          imageUrl: post.imageUrl,
          image: post.image,
          media: post.media,
          images: post.images,
        })

        return (
          <div
            key={post.id}
            className="group cursor-pointer"
            onClick={() => {
              console.log("ExploreGrid - Opening modal for post:", post)
              setSelectedPost(post)
            }}
          >
            <div className="aspect-w-1 aspect-h-1 relative overflow-hidden rounded-md bg-gray-200">
              {post.imageUrl ? (
                <img
                  src={post.imageUrl || "/placeholder.svg"}
                  alt={`Post ${post.id}`}
                  className="object-cover group-hover:opacity-75 transition"
                />
              ) : post.image ? (
                <img
                  src={post.image || "/placeholder.svg"}
                  alt={`Post ${post.id}`}
                  className="object-cover group-hover:opacity-75 transition"
                />
              ) : post.media && post.media.length > 0 ? (
                <img
                  src={post.media[0].url || "/placeholder.svg"}
                  alt={`Post ${post.id}`}
                  className="object-cover group-hover:opacity-75 transition"
                />
              ) : post.images && post.images.length > 0 ? (
                <img
                  src={post.images[0].url || "/placeholder.svg"}
                  alt={`Post ${post.id}`}
                  className="object-cover group-hover:opacity-75 transition"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-300">No Image</div>
              )}
            </div>
          </div>
        )
      })}

      <PostDetailModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onEdit={(postId) => console.log("Edit post:", postId)}
        onDelete={(postId) => console.log("Delete post:", postId)}
      />
    </div>
  )
}

export default ExploreGridClient
