"use client"

import { useState, useEffect } from "react"
import Post from "@/components/post"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { CreatePostButton } from "@/components/profile/create-post-button"
import { LoadMorePosts } from "@/components/load-more-posts"

// Import sample data
import { samplePosts } from "@/lib/sample-data"

export function PostFeed() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const [useSampleData, setUseSampleData] = useState(false)

  useEffect(() => {
    // Check if we should use sample data
    const useSample = process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === "true"
    setUseSampleData(useSample)

    if (useSample) {
      // Use sample data
      setPosts(samplePosts)
      setLoading(false)
      setHasMore(false)
      return
    }

    // Otherwise fetch from API
    fetchPosts()
  }, [])

  const fetchPosts = async (pageToFetch = 1) => {
    try {
      setLoading(true)
      setError(null)

      // If using sample data, just return
      if (useSampleData) {
        setLoading(false)
        return
      }

      // Get the API URL from environment variables
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

      // Fetch posts from the API
      const response = await fetch(`${API_URL}/api/posts?page=${pageToFetch}&pageSize=10&_sort=createdAt:desc`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }

      const data = await response.json()

      // Check if we have posts
      if (data && data.data && Array.isArray(data.data)) {
        if (pageToFetch === 1) {
          // First page, replace all posts
          setPosts(data.data)
        } else {
          // Subsequent pages, append posts
          setPosts((prev) => [...prev, ...data.data])
        }

        // Check if we have more posts to load
        setHasMore(data.data.length > 0)
      } else {
        // If no posts or invalid response, use sample data as fallback
        if (pageToFetch === 1) {
          setPosts(samplePosts)
          setUseSampleData(true)
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Failed to load posts. Using sample data instead.")

      // Use sample data as fallback
      if (page === 1) {
        setPosts(samplePosts)
        setUseSampleData(true)
      }
      setHasMore(false)

      toast({
        title: "Error loading posts",
        description: "We're having trouble loading posts. Showing sample content instead.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage)
  }

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
    toast({
      title: "Post deleted",
      description: "Your post has been successfully deleted.",
    })
  }

  const handlePostUpdated = (updatedPost: any) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
  }

  const handlePostCreated = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev])
    toast({
      title: "Post created",
      description: "Your post has been successfully published.",
    })
  }

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isAuthenticated && (
        <div className="mb-6">
          <CreatePostButton onPostCreated={handlePostCreated} />
        </div>
      )}

      {error && !useSampleData && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={() => fetchPosts()}>
            Try Again
          </Button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-500 mb-4">Be the first to share your nail art!</p>
          {isAuthenticated && <CreatePostButton onPostCreated={handlePostCreated} />}
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <Post key={post.id} post={post} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
          ))}

          {hasMore && <LoadMorePosts onClick={handleLoadMore} loading={loading} />}
        </>
      )}
    </div>
  )
}
