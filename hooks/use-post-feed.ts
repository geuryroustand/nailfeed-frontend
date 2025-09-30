"use client"

import { useState, useCallback, useEffect } from "react"

/**
 * Custom hook to manage post feed with optimistic updates
 * Handles post creation, updates, and avoids duplication
 */
export function usePostFeed(initialPosts: any[] = []) {
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [optimisticPosts, setOptimisticPosts] = useState<Map<string, any>>(new Map())

  // Add or update a post
  const handlePostCreated = useCallback((newPost: any) => {
    console.log("[PostFeed] Handling post:", newPost)

    if (newPost.isOptimistic) {
      // Handle optimistic post
      console.log("[PostFeed] Adding optimistic post:", newPost.id)
      setOptimisticPosts(prev => new Map(prev.set(newPost.id, newPost)))
    } else {
      // Handle real post from server
      console.log("[PostFeed] Adding real post:", newPost.id)

      // If this post has a tempId, it's replacing an optimistic post
      if (newPost.tempId) {
        console.log("[PostFeed] Replacing optimistic post:", newPost.tempId, "with real post:", newPost.id)

        // Remove the optimistic post
        setOptimisticPosts(prev => {
          const updated = new Map(prev)
          updated.delete(newPost.tempId)
          return updated
        })
      }

      // Add the real post to the main posts array
      setPosts(prev => {
        // Check if post already exists to avoid duplicates
        const existingIndex = prev.findIndex(p =>
          p.id === newPost.id ||
          p.documentId === newPost.documentId ||
          (p.tempId && p.tempId === newPost.tempId)
        )

        if (existingIndex >= 0) {
          // Update existing post
          console.log("[PostFeed] Updating existing post at index:", existingIndex)
          const updated = [...prev]
          updated[existingIndex] = newPost
          return updated
        } else {
          // Add new post at the beginning
          console.log("[PostFeed] Adding new post to feed")
          return [newPost, ...prev]
        }
      })
    }
  }, [])

  // Remove a failed optimistic post
  const handlePostCreationFailed = useCallback((tempId: string) => {
    console.log("[PostFeed] Removing failed optimistic post:", tempId)
    setOptimisticPosts(prev => {
      const updated = new Map(prev)
      updated.delete(tempId)
      return updated
    })
  }, [])

  // Update an existing post
  const handlePostUpdated = useCallback((updatedPost: any) => {
    console.log("[PostFeed] Updating post:", updatedPost.id)
    setPosts(prev => prev.map(post =>
      (post.id === updatedPost.id || post.documentId === updatedPost.documentId)
        ? { ...post, ...updatedPost }
        : post
    ))
  }, [])

  // Remove a post
  const handlePostDeleted = useCallback((postId: string | number) => {
    console.log("[PostFeed] Deleting post:", postId)
    setPosts(prev => prev.filter(post =>
      post.id !== postId &&
      post.documentId !== postId
    ))

    // Also remove from optimistic posts if it exists
    setOptimisticPosts(prev => {
      const updated = new Map(prev)
      updated.delete(postId.toString())
      return updated
    })
  }, [])

  // Get combined posts (optimistic + real) for display
  const displayPosts = useCallback(() => {
    const optimisticArray = Array.from(optimisticPosts.values())
    console.log("[PostFeed] Display posts - optimistic:", optimisticArray.length, "real:", posts.length)

    // Return optimistic posts first, then real posts
    return [...optimisticArray, ...posts]
  }, [optimisticPosts, posts])

  // Update posts from external source (e.g., fetch)
  const updatePosts = useCallback((newPosts: any[]) => {
    console.log("[PostFeed] Updating posts from external source:", newPosts.length)

    // Only update if the posts are actually different to avoid unnecessary re-renders
    setPosts(current => {
      // Quick length check first
      if (current.length !== newPosts.length) {
        return newPosts;
      }

      // Check if content is actually different
      const isDifferent = newPosts.some((newPost, index) =>
        !current[index] || current[index].id !== newPost.id
      );

      if (isDifferent) {
        return newPosts;
      }

      // Return current to avoid unnecessary re-render
      console.log("[PostFeed] Posts unchanged, skipping update");
      return current;
    });
  }, [])

  // Clear optimistic posts (useful for error recovery)
  const clearOptimisticPosts = useCallback(() => {
    console.log("[PostFeed] Clearing all optimistic posts")
    setOptimisticPosts(new Map())
  }, [])

  // Debug effect
  useEffect(() => {
    console.log("[PostFeed] State updated - optimistic posts:", optimisticPosts.size, "real posts:", posts.length)
  }, [optimisticPosts.size, posts.length])

  return {
    posts: displayPosts(),
    realPosts: posts,
    optimisticPostsCount: optimisticPosts.size,
    handlePostCreated,
    handlePostCreationFailed,
    handlePostUpdated,
    handlePostDeleted,
    updatePosts,
    clearOptimisticPosts,
  }
}
