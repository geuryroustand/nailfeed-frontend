"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Bookmark } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TryOnButton } from "@/components/try-on/try-on-button"
import { PostDetailModal } from "./post-detail-modal"
import { LoadMoreIndicator } from "./load-more-indicator"
import { useInView } from "react-intersection-observer"
import type { ExplorePostWithLiked } from "@/lib/explore-data"
import { getMorePosts, likePost, savePost, addComment } from "@/lib/explore-actions"

interface ExploreGridClientProps {
  initialPosts: ExplorePostWithLiked[]
  hasMore?: boolean
}

export default function ExploreGridClient({ initialPosts, hasMore = true }: ExploreGridClientProps) {
  const [posts, setPosts] = useState<ExplorePostWithLiked[]>(initialPosts)
  const [selectedPost, setSelectedPost] = useState<ExplorePostWithLiked | null>(null)
  const [loading, setLoading] = useState(false)
  const [endReached, setEndReached] = useState(!hasMore)
  const { ref, inView } = useInView()

  // Load more posts when the indicator comes into view
  useEffect(() => {
    const loadMore = async () => {
      if (inView && !loading && !endReached) {
        setLoading(true)
        try {
          const lastPostId = posts[posts.length - 1]?.id
          const newPosts = await getMorePosts(lastPostId)

          if (newPosts.length === 0) {
            setEndReached(true)
          } else {
            setPosts((prev) => [...prev, ...newPosts])
          }
        } catch (error) {
          console.error("Error loading more posts:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadMore()
  }, [inView, loading, endReached, posts])

  const handlePostClick = (post: ExplorePostWithLiked) => {
    setSelectedPost(post)
  }

  const handleCloseModal = () => {
    setSelectedPost(null)
  }

  const handleLike = useCallback(async (postId: number) => {
    try {
      await likePost(postId)
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              }
            : post,
        ),
      )
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }, [])

  const handleSave = useCallback(async (postId: number) => {
    try {
      await savePost(postId)
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isSaved: !post.isSaved,
              }
            : post,
        ),
      )
    } catch (error) {
      console.error("Error saving post:", error)
    }
  }, [])

  const handleAddComment = useCallback(
    async (comment: string) => {
      if (!selectedPost) return

      try {
        const result = await addComment(selectedPost.id, comment)
        return result
      } catch (error) {
        console.error("Error adding comment:", error)
        throw error
      }
    },
    [selectedPost],
  )

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
            <div className="aspect-square relative" onClick={() => handlePostClick(post)}>
              <img
                src={post.image || "/placeholder.svg"}
                alt={`Nail art by ${post.username}`}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-end">
                <div className="p-4 text-white w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Heart className={`h-4 w-4 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      <span className="text-sm">{post.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{post.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.userImage || "/placeholder.svg"} alt={post.username} />
                    <AvatarFallback>{post.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{post.username}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TryOnButton
                    designImageUrl={post.image || ""}
                    designTitle={post.description?.split(" ").slice(0, 3).join(" ") || "Nail Design"}
                    variant="ghost"
                    size="sm"
                    showIcon={false}
                    className="text-xs px-2 py-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 py-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(post.id)
                    }}
                  >
                    <Heart className={`h-3 w-3 mr-1 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 py-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSave(post.id)
                    }}
                  >
                    <Bookmark className={`h-3 w-3 ${post.isSaved ? "fill-black" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load more indicator */}
      {!endReached && (
        <div ref={ref} className="mt-8 mb-4">
          <LoadMoreIndicator loading={loading} />
        </div>
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={handleCloseModal}
          onLike={() => handleLike(selectedPost.id)}
          onSave={() => handleSave(selectedPost.id)}
          onAddComment={handleAddComment}
        />
      )}
    </>
  )
}
