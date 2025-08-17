"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Filter } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [showFollowingOnly, setShowFollowingOnly] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  console.log(`FollowListClient initial data (${listType}):`, data)

  const getDisplayName = (user) => {
    if (listType === "followers" && user.follower) {
      return user.follower.displayName || user.follower.username || "User"
    }
    if (listType === "following" && user.following) {
      return user.following.displayName || user.following.username || "User"
    }
    return user.displayName || user.username || "User"
  }

  const getUsername = (user) => {
    if (listType === "followers" && user.follower) {
      return user.follower.username || "unknown"
    }
    if (listType === "following" && user.following) {
      return user.following.username || "unknown"
    }
    return user.username || "unknown"
  }

  const getUserId = (user) => {
    if (listType === "followers" && user.follower) {
      return user.follower.id
    }
    if (listType === "following" && user.following) {
      return user.following.id
    }
    return user.id
  }

  const filteredUsers = useMemo(() => {
    let filtered = data.users || []

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((user) => {
        const displayName = getDisplayName(user).toLowerCase()
        const username = getUsername(user).toLowerCase()
        return displayName.includes(query) || username.includes(query)
      })
    }

    if (showFollowingOnly) {
      filtered = filtered.filter((user) => user.isFollowing)
    }

    return filtered
  }, [data.users, searchQuery, showFollowingOnly])

  const handlePageChange = async (newPage: number) => {
    if (newPage === data.page || newPage < 1 || newPage > data.totalPages) {
      return
    }

    setIsLoading(true)
    try {
      const newData = await fetchFunction(username, newPage, Math.min(data.pageSize, 50))
      setData(newData)
      setSearchQuery("")
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
    if (loadingUserId !== null) return

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
      setData((prevData) => ({
        ...prevData,
        users: prevData.users.map((user) => {
          const userId = getUserId(user)
          if (userId === targetUser.id) {
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
        setData((prevData) => ({
          ...prevData,
          users: prevData.users.map((user) => {
            const userId = getUserId(user)
            if (userId === targetUser.id) {
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
        toast({
          title: result.isFollowing ? "Following" : "Unfollowed",
          description: result.isFollowing
            ? `You are now following ${targetUser.username}`
            : `You unfollowed ${targetUser.username}`,
        })

        router.refresh()
      }
    } catch (error) {
      console.error("Error toggling follow:", error)

      setData((prevData) => ({
        ...prevData,
        users: prevData.users.map((user) => {
          const userId = getUserId(user)
          if (userId === targetUser.id) {
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
    setImageErrors((prev) => ({
      ...prev,
      [userId.toString()]: true,
    }))
  }

  const getShortUsername = (fullName: string): string => {
    try {
      if (fullName.includes(" ")) {
        const [firstName, ...lastNameParts] = fullName.split(" ")
        const lastName = lastNameParts.join(" ")

        const firstInitial = firstName.charAt(0).toUpperCase()
        const lastNameShort = lastName.substring(0, 7)

        return `${firstInitial}${lastNameShort}`
      }

      if (fullName.length <= 2) {
        return fullName.toUpperCase()
      }

      return fullName.substring(0, 2).toUpperCase()
    } catch (error) {
      console.error("Error generating short username:", error)
      return "??"
    }
  }

  const getUserImageUrl = (user) => {
    if (!user) {
      return null
    }

    if (user.profileImage) {
      if (user.profileImage.url) {
        const imageUrl = user.profileImage.url
        return ensureAbsoluteUrl(imageUrl)
      }

      if (user.profileImage.formats && user.profileImage.formats.thumbnail && user.profileImage.formats.thumbnail.url) {
        const thumbnailUrl = user.profileImage.formats.thumbnail.url
        return ensureAbsoluteUrl(thumbnailUrl)
      }
    }

    if (user.following && user.following.profileImage) {
      if (user.following.profileImage.url) {
        const imageUrl = user.following.profileImage.url
        return ensureAbsoluteUrl(imageUrl)
      }

      if (
        user.following.profileImage.formats &&
        user.following.profileImage.formats.thumbnail &&
        user.following.profileImage.formats.thumbnail.url
      ) {
        const thumbnailUrl = user.following.profileImage.formats.thumbnail.url
        return ensureAbsoluteUrl(thumbnailUrl)
      }
    }

    if (user.follower && user.follower.profileImage) {
      if (user.follower.profileImage.url) {
        const imageUrl = user.follower.profileImage.url
        return ensureAbsoluteUrl(imageUrl)
      }

      if (
        user.follower.profileImage.formats &&
        user.follower.profileImage.formats.thumbnail &&
        user.follower.profileImage.formats.thumbnail.url
      ) {
        const thumbnailUrl = user.follower.profileImage.formats.thumbnail.url
        return ensureAbsoluteUrl(thumbnailUrl)
      }
    }

    if (user.avatar) {
      return ensureAbsoluteUrl(user.avatar)
    }

    if (user.following && user.following.avatar) {
      return ensureAbsoluteUrl(user.following.avatar)
    }

    if (user.follower && user.follower.avatar) {
      return ensureAbsoluteUrl(user.follower.avatar)
    }

    return null
  }

  const ensureAbsoluteUrl = (url) => {
    if (!url) return ""

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
    return url.startsWith("/") ? `${apiBaseUrl}${url}` : `${apiBaseUrl}/${url}`
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Search ${listType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
        {isAuthenticated && (
          <Button
            variant={showFollowingOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFollowingOnly(!showFollowingOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Following only
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? `No ${listType} found matching "${searchQuery}"` : `No ${listType} to display`}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const userId = getUserId(user)
            const displayName = getDisplayName(user)
            const username = getUsername(user)

            if (!userId || !username) {
              console.warn("Incomplete user data:", user)
              return null
            }

            const imageUrl = getUserImageUrl(user)
            const hasImageError = imageErrors[userId.toString()]
            const shortUsername = getShortUsername(displayName)

            return (
              <div
                key={userId}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
              >
                <Link href={`/profile/${username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 flex-shrink-0">
                    {imageUrl && !hasImageError ? (
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="48px"
                        onError={() => handleImageError(userId)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 text-pink-800 font-semibold text-sm">
                        {shortUsername}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-sm text-gray-500 truncate">@{username}</p>
                  </div>
                </Link>
                {isAuthenticated && !isOwnProfile && username !== username && (
                  <Button
                    variant={user.isFollowing ? "outline" : "default"}
                    size="sm"
                    className={
                      user.isFollowing
                        ? "rounded-full px-4 text-xs font-medium"
                        : "rounded-full px-4 text-xs font-medium bg-pink-500 hover:bg-pink-600 text-white"
                    }
                    onClick={() => handleToggleFollow({ id: userId, username, isFollowing: user.isFollowing })}
                    disabled={loadingUserId === userId}
                  >
                    {loadingUserId === userId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : user.isFollowing ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>

      {data.totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {filteredUsers.length} of {data.total.toLocaleString()} {listType}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page === 1 || isLoading}
              className="text-xs"
            >
              Previous
            </Button>
            <div className="text-xs text-gray-600 px-2">
              {data.page} / {data.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page === data.totalPages || isLoading}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
