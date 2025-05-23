"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserX } from "lucide-react"
import { type NetworkListResponse, toggleFollowStatus } from "@/lib/services/client-network-service"
import { useAuth } from "@/hooks/use-auth"

interface FollowListClientProps {
  initialData: NetworkListResponse
  fetchFunction: (username: string, page: number, pageSize: number) => Promise<NetworkListResponse>
  username: string
  listType: "followers" | "following"
  isOwnProfile: boolean
}

export default function FollowListClient({
  initialData,
  fetchFunction,
  username,
  listType,
  isOwnProfile,
}: FollowListClientProps) {
  const [data, setData] = useState<NetworkListResponse>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUserId, setLoadingUserId] = useState<number | string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Log the initial data for debugging
  console.log(`FollowListClient initial data (${listType}):`, data)

  const handlePageChange = async (newPage: number) => {
    if (newPage === data.page || newPage < 1 || newPage > data.totalPages) {
      return
    }

    setIsLoading(true)
    try {
      const newData = await fetchFunction(username, newPage, data.pageSize)
      setData(newData)
    } catch (error) {
      console.error(`Error fetching ${listType} page ${newPage}:`, error)
      toast({
        title: "Error",
        description: `Failed to load ${listType} data.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFollow = async (targetUser: { id: number | string; username: string; isFollowing?: boolean }) => {
    if (loadingUserId !== null) return // Prevent multiple simultaneous actions

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow users",
      })
      router.push("/auth")
      return
    }

    setLoadingUserId(targetUser.id)

    try {
      // Optimistic update
      setData((prevData) => ({
        ...prevData,
        users: prevData.users.map((user) => {
          if (user.id === targetUser.id) {
            return {
              ...user,
              isFollowing: !user.isFollowing,
            }
          }
          return user
        }),
      }))

      const result = await toggleFollowStatus(targetUser.username, !!targetUser.isFollowing)

      if (!result.success) {
        // Revert optimistic update if failed
        setData((prevData) => ({
          ...prevData,
          users: prevData.users.map((user) => {
            if (user.id === targetUser.id) {
              return {
                ...user,
                isFollowing: targetUser.isFollowing,
              }
            }
            return user
          }),
        }))

        toast({
          title: "Error",
          description: result.message || "Failed to update follow status",
          variant: "destructive",
        })
      } else {
        // Show success message
        toast({
          title: result.isFollowing ? "Following" : "Unfollowed",
          description: result.isFollowing
            ? `You are now following ${targetUser.username}`
            : `You unfollowed ${targetUser.username}`,
        })

        // Refresh the page to update counts
        router.refresh()
      }
    } catch (error) {
      console.error("Error toggling follow:", error)

      // Revert optimistic update
      setData((prevData) => ({
        ...prevData,
        users: prevData.users.map((user) => {
          if (user.id === targetUser.id) {
            return {
              ...user,
              isFollowing: targetUser.isFollowing,
            }
          }
          return user
        }),
      }))

      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoadingUserId(null)
    }
  }

  const handleImageError = (userId: number | string) => {
    console.error(`Image loading failed for user ID: ${userId}`)
    setImageErrors((prev) => ({
      ...prev,
      [userId.toString()]: true,
    }))
  }

  // Generate a short version of the username for display when no profile image is available
  const getShortUsername = (fullName: string): string => {
    try {
      // If the name contains a space, assume it's a first and last name
      if (fullName.includes(" ")) {
        const [firstName, ...lastNameParts] = fullName.split(" ")
        const lastName = lastNameParts.join(" ")

        // Get first letter of first name
        const firstInitial = firstName.charAt(0).toUpperCase()

        // Get up to first 7 characters of last name
        const lastNameShort = lastName.substring(0, 7)

        return `${firstInitial}${lastNameShort}`
      }

      // If it's a single name or username
      if (fullName.length <= 2) {
        return fullName.toUpperCase()
      }

      // Otherwise, take the first 2 characters
      return fullName.substring(0, 2).toUpperCase()
    } catch (error) {
      console.error("Error generating short username:", error)
      return "??"
    }
  }

  // Handle empty state
  if (!data || !data.users || data.users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <UserX className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium">No {listType} yet</h3>
        <p className="text-gray-500 mt-2">
          {listType === "followers"
            ? `${username} doesn't have any followers yet.`
            : `${username} isn't following anyone yet.`}
        </p>
      </div>
    )
  }

  // When rendering the user avatar image, update the image URL handling:
  const getUserImageUrl = (user) => {
    if (!user) {
      return null
    }

    // For direct profile image access
    if (user.profileImage) {
      // Get URL from the profileImage object
      if (user.profileImage.url) {
        const imageUrl = user.profileImage.url
        return ensureAbsoluteUrl(imageUrl)
      }

      // Try to get thumbnail URL if available
      if (user.profileImage.formats && user.profileImage.formats.thumbnail && user.profileImage.formats.thumbnail.url) {
        const thumbnailUrl = user.profileImage.formats.thumbnail.url
        return ensureAbsoluteUrl(thumbnailUrl)
      }
    }

    // For nested structure in following property
    if (user.following && user.following.profileImage) {
      // Get URL from the nested profileImage object
      if (user.following.profileImage.url) {
        const imageUrl = user.following.profileImage.url
        return ensureAbsoluteUrl(imageUrl)
      }

      // Try to get thumbnail URL if available
      if (
        user.following.profileImage.formats &&
        user.following.profileImage.formats.thumbnail &&
        user.following.profileImage.formats.thumbnail.url
      ) {
        const thumbnailUrl = user.following.profileImage.formats.thumbnail.url
        return ensureAbsoluteUrl(thumbnailUrl)
      }
    }

    // For nested structure in follower property
    if (user.follower && user.follower.profileImage) {
      // Get URL from the nested profileImage object
      if (user.follower.profileImage.url) {
        const imageUrl = user.follower.profileImage.url
        return ensureAbsoluteUrl(imageUrl)
      }

      // Try to get thumbnail URL if available
      if (
        user.follower.profileImage.formats &&
        user.follower.profileImage.formats.thumbnail &&
        user.follower.profileImage.formats.thumbnail.url
      ) {
        const thumbnailUrl = user.follower.profileImage.formats.thumbnail.url
        return ensureAbsoluteUrl(thumbnailUrl)
      }
    }

    // If no profile image found, use avatar if available
    if (user.avatar) {
      return ensureAbsoluteUrl(user.avatar)
    }

    // Check for avatar in nested objects
    if (user.following && user.following.avatar) {
      return ensureAbsoluteUrl(user.following.avatar)
    }

    if (user.follower && user.follower.avatar) {
      return ensureAbsoluteUrl(user.follower.avatar)
    }

    // Return null to trigger the fallback
    return null
  }

  // Helper function to ensure URL is absolute
  const ensureAbsoluteUrl = (url) => {
    if (!url) return ""

    // If already absolute, return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }

    // Add API base URL for relative URLs
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
    return url.startsWith("/") ? `${apiBaseUrl}${url}` : `${apiBaseUrl}/${url}`
  }

  // Get display name for a user
  const getDisplayName = (user) => {
    return user.displayName || user.username || user.following?.displayName || user.following?.username || "User"
  }

  // Get username for a user
  const getUsername = (user) => {
    return user.username || user.following?.username || "unknown"
  }

  return (
    <div>
      <div className="space-y-4">
        {data.users.map((user) => {
          // Skip rendering if user data is incomplete
          if (!user || !user.username) {
            console.warn("Incomplete user data:", user)
            return null
          }

          const displayName = getDisplayName(user)
          const username = getUsername(user)
          const imageUrl = getUserImageUrl(user)
          const hasImageError = imageErrors[user.id.toString()]
          const shortUsername = getShortUsername(displayName)

          // Update the image URL handling in the component
          return (
            <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <Link href={`/profile/${username}`} className="flex items-center gap-3 flex-1">
                <div className="relative h-12 w-12 rounded-full overflow-hidden border bg-gray-100">
                  {imageUrl && !hasImageError ? (
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="48px"
                      onError={() => handleImageError(user.id)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-pink-100 text-pink-800 font-medium">
                      {shortUsername}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{displayName}</p>
                  <p className="text-sm text-gray-500">@{username}</p>
                </div>
              </Link>
              {isAuthenticated && !isOwnProfile && username !== username && (
                <Button
                  variant={user.isFollowing ? "outline" : "default"}
                  size="sm"
                  className={
                    user.isFollowing
                      ? "rounded-full px-4 ml-auto"
                      : "rounded-full px-4 ml-auto bg-pink-500 hover:bg-pink-600"
                  }
                  onClick={() => handleToggleFollow(user)}
                  disabled={loadingUserId === user.id}
                >
                  {loadingUserId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : user.isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination controls */}
      {data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(data.page - 1)}
            disabled={data.page === 1 || isLoading}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {data.page} of {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(data.page + 1)}
            disabled={data.page === data.totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Total count */}
      <div className="text-center text-sm text-gray-500 mt-4">
        {data.total} {listType}
      </div>
    </div>
  )
}
