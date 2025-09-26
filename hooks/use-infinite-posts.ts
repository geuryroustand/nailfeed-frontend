"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchUserPostsClient } from "@/lib/services/profile-posts-client-service"

interface Post {
  id: number;
  documentId: string;
  title?: string;
  description?: string;
  contentType: string;
  background?: any;
  media?: any[];
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: string;
  updatedAt: string;
  user?: any;
}

interface UseInfinitePostsResult {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  total: number;
  loadMore: () => void;
  refresh: () => void;
}

export function useInfinitePosts(documentId: string, limit: number = 10): UseInfinitePostsResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPosts = useCallback(async (page: number, isLoadingMore: boolean = false) => {
    if (isLoadingMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await fetchUserPostsClient(documentId, page, limit);

      if ("error" in result) {
        setError(result.message);
        return;
      }

      if (page === 1) {
        // First load - replace all posts
        setPosts(result.posts);
      } else {
        // Load more - append posts
        setPosts(prev => [...prev, ...result.posts]);
      }

      setHasMore(result.hasMore);
      setTotal(result.total);
      setCurrentPage(page);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [documentId, limit]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadPosts(currentPage + 1, true);
    }
  }, [loadPosts, currentPage, hasMore, isLoadingMore]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    setPosts([]);
    loadPosts(1, false);
  }, [loadPosts]);

  // Initial load
  useEffect(() => {
    if (documentId) {
      loadPosts(1, false);
    }
  }, [documentId, loadPosts]);

  return {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    total,
    loadMore,
    refresh
  };
}