"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, UserPlus, UserMinus } from "lucide-react"
import Link from "next/link"
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { fetchUserFollowersClient, fetchUserFollowingClient } from "@/lib/services/client-profile-service"

interface FollowUser {
  id: number
  documentId: string
  username: string
  displayName?: string
  profileImage?: {
    url: string
    alternativeText?: string
  }
  isVerified?: boolean
}

interface FollowListClientV2Props {
  type: "followers" | "following"
  initialData: FollowUser[]
  pagination: any
  targetUserId?: string
  username: string
  isOwnProfile: boolean
}

export default function FollowListClientV2({
  type,
  initialData,
  pagination: initialPagination,
  targetUserId,
  username,
  isOwnProfile,
}: FollowListClientV2Props) {
  const [users, setUsers] = useState<FollowUser[]>(initialData)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [processingFollow, setProcessingFollow] = useState<Set<string>>(new Set())

  const { toast } = useToast()
  const { isAuthenticated, user: currentUser } = useAuth()

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (users.length > 0) return // Already have data

      setLoading(true)
      setError(null)

      try {
        const result = type === "followers"
          ? await fetchUserFollowersClient(targetUserId, 1, 25)
          : await fetchUserFollowingClient(targetUserId, 1, 25)

        if ("error" in result) {
          throw new Error(result.message)
        }

        setUsers(result.data)
        setPagination(result.pagination)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data"
        setError(errorMessage)
        console.error("Error loading initial data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [type, targetUserId]) // Removed users.length to prevent infinite loop

  // Load more users
  const loadMore = useCallback(async () => {
    if (loading || !pagination || pagination.page >= pagination.pageCount) return

    setLoading(true)
    setError(null)

    try {
      const nextPage = pagination.page + 1
      const result = type === "followers"
        ? await fetchUserFollowersClient(targetUserId, nextPage, 25)
        : await fetchUserFollowingClient(targetUserId, nextPage, 25)

      if ("error" in result) {
        throw new Error(result.message)
      }

      setUsers(prev => [...prev, ...result.data])
      setPagination(result.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load more users"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [loading, pagination, targetUserId, type, toast])

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
      // Use the new toggle endpoint from the backend API
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

      // Update the following state
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

  // Get follow status for a user
  const getFollowStatus = useCallback((userDocumentId: string): boolean => {
    return followingStates[userDocumentId] ?? false
  }, [followingStates])

  // Check if we can load more
  const canLoadMore = pagination && pagination.page < pagination.pageCount

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
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.documentId} className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link href={`/profile/${user.documentId}`} className="flex items-center gap-3 flex-1 min-w-0">
                <EnhancedAvatar
                  src={user.profileImage?.url}
                  alt={user.displayName || user.username}
                  fallbackText={user.displayName || user.username}
                  size="lg"
                  className="transition-transform hover:scale-105"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {user.displayName || user.username}
                    </h3>
                    {user.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
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

            {/* Follow/Unfollow button - only show if authenticated and not own profile */}
            {isAuthenticated && currentUser && user.documentId !== currentUser.documentId && (
              <Button
                variant={getFollowStatus(user.documentId) ? "outline" : "default"}
                size="sm"
                onClick={() => toggleFollow(user.documentId, getFollowStatus(user.documentId))}
                disabled={processingFollow.has(user.documentId)}
                className="ml-3 min-w-[100px]"
              >
                {processingFollow.has(user.documentId) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : getFollowStatus(user.documentId) ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Load more button */}
      {canLoadMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}

      {pagination && (
        <div className="text-center text-sm text-gray-500 pt-2">
          Showing {users.length} of {pagination.total} {type}
        </div>
      )}
    </div>
  )
}
