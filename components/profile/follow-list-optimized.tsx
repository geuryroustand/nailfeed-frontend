"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, UserPlus, UserMinus } from "lucide-react"
import Link from "next/link"
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { fetchNetworkDataBatch, NetworkUser } from "@/lib/services/network-batch-service"

interface FollowListOptimizedProps {
  type: "followers" | "following"
  targetUserId?: string
  username: string
  isOwnProfile: boolean
  preview?: boolean
  initialData?: NetworkUser[]
}

export default function FollowListOptimized({
  type,
  targetUserId,
  username,
  isOwnProfile,
  preview = false,
  initialData = [],
}: FollowListOptimizedProps) {
  const [users, setUsers] = useState<NetworkUser[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [processingFollow, setProcessingFollow] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)

  const { toast } = useToast()
  const { isAuthenticated, user: currentUser } = useAuth()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // For preview mode, just show the initial data
  if (preview) {
    return (
      <div className="space-y-1">
        {initialData.map((user) => (
          <div key={user.documentId} className="flex items-center gap-2 py-1">
            <Link href={`/profile/${user.documentId}`} className="flex items-center gap-2 flex-1 min-w-0">
              <EnhancedAvatar
                src={user.profileImage?.url}
                alt={user.displayName || user.username}
                fallbackText={user.displayName || user.username}
                size="sm"
                className="transition-transform hover:scale-105"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName || user.username}
                  </h3>
                  {user.isVerified && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    )
  }

  // Load more users function (optimized to only fetch one type at a time)
  const loadUsers = useCallback(async (pageNumber: number, reset = false) => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      // For infinite scroll in modal, we fetch only the requested type
      const followersPage = type === "followers" ? pageNumber : 1
      const followingPage = type === "following" ? pageNumber : 1

      const result = await fetchNetworkDataBatch(
        targetUserId,
        followersPage,
        followingPage,
        10
      )

      if ("error" in result) {
        throw new Error(result.message)
      }

      const newUsers = type === "followers" ? result.followers.users : result.following.users
      const pagination = type === "followers" ? result.followers : result.following

      if (reset) {
        setUsers(newUsers)
      } else {
        setUsers(prev => [...prev, ...newUsers])
      }

      setHasMore(pagination.page < pagination.pageCount)
      setPage(pageNumber)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load users"
      setError(errorMessage)
      console.error("Error loading users:", err)
    } finally {
      setLoading(false)
    }
  }, [type, targetUserId]) // Removed loading dependency to prevent circular calls

  // Load initial data if not provided OR load full page for modal
  useEffect(() => {
    if (initialized) return // Prevent multiple initializations

    if (preview) {
      // Preview mode: just use initial data
      setUsers(initialData)
      setHasMore(false)
      setInitialized(true)
    } else {
      // Modal mode: always load full first page
      loadUsers(1, true)
      setInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, targetUserId, preview, initialized]) // Added initialized flag

  // Infinite scroll setup (only for modal, not preview)
  useEffect(() => {
    if (preview || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadUsers(page + 1)
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current = observer

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, page, preview]) // Removed loadUsers to prevent infinite re-creation

  // Toggle follow status
  const toggleFollow = useCallback(async (targetDocumentId: string, currentlyFollowing: boolean) => {
    if (!isAuthenticated || !currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive",
      })
      return
    }

    if (processingFollow.has(targetDocumentId)) return

    setProcessingFollow(prev => new Set(prev).add(targetDocumentId))

    try {
      const response = await fetch("/api/auth-proxy/follow/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: targetDocumentId,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to ${currentlyFollowing ? 'unfollow' : 'follow'} user`)
      }

      const result = await response.json()

      setFollowingStates(prev => ({
        ...prev,
        [targetDocumentId]: result.isFollowing,
      }))

      toast({
        title: result.action === "followed" ? "User followed" : "User unfollowed",
        description: result.message,
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      console.error("Follow toggle error:", err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setProcessingFollow(prev => {
        const newSet = new Set(prev)
        newSet.delete(targetDocumentId)
        return newSet
      })
    }
  }, [isAuthenticated, currentUser, processingFollow, toast])

  const getFollowStatus = useCallback((userDocumentId: string): boolean => {
    return followingStates[userDocumentId] ?? false
  }, [followingStates])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (users.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          {type === "followers"
            ? isOwnProfile
              ? "You don't have any followers yet"
              : `${username} doesn't have any followers yet`
            : isOwnProfile
            ? "You're not following anyone yet"
            : `${username} isn't following anyone yet`}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 flex-1 overflow-y-auto">
      {users.map((user) => (
        <div key={user.documentId} className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href={`/profile/${user.documentId}`} className="flex items-center gap-3 flex-1 min-w-0">
              <EnhancedAvatar
                src={user.profileImage?.url}
                alt={user.displayName || user.username}
                fallbackText={user.displayName || user.username}
                size="md"
                className="transition-transform hover:scale-105"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {user.displayName || user.username}
                  </h3>
                  {user.isVerified && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                {user.displayName && (
                  <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Follow/Unfollow button */}
          {isAuthenticated && currentUser && user.documentId !== currentUser.documentId && (
            <Button
              variant={getFollowStatus(user.documentId) ? "outline" : "default"}
              size="sm"
              onClick={() => toggleFollow(user.documentId, getFollowStatus(user.documentId))}
              disabled={processingFollow.has(user.documentId)}
              className="ml-3 min-w-[80px]"
            >
              {processingFollow.has(user.documentId) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : getFollowStatus(user.documentId) ? (
                <>
                  <UserMinus className="h-3 w-3 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-4">
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          <div className="text-sm text-gray-500 mt-2">Loading...</div>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && !loading && (
        <div ref={loadMoreRef} className="h-4" />
      )}

      {/* No more results */}
      {!hasMore && users.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No more {type} to show
        </div>
      )}
    </div>
  )
}
