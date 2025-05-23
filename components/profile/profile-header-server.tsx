import { ProfileHeaderClient } from "@/components/profile/profile-header-client"
import type { UserProfileResponse } from "@/lib/services/user-service"
import { getProfileImageUrl, getCoverImageUrl } from "@/lib/api-url-helper"
import { checkFollowStatus } from "@/lib/actions/profile-server-actions"

interface ProfileHeaderServerProps {
  user: UserProfileResponse
  isOtherUser?: boolean
}

export async function ProfileHeaderServer({ user, isOtherUser = false }: ProfileHeaderServerProps) {
  if (!user) {
    return <div className="p-4 text-center">Error loading profile data</div>
  }

  // Get follow status on the server if this is another user's profile
  let isFollowing = false
  if (isOtherUser) {
    try {
      const followStatus = await checkFollowStatus(user.username)
      isFollowing = followStatus.isFollowing
    } catch (error) {
      console.error("Error checking follow status:", error)
    }
  }

  // Extract profile image URL using the helper function or directly from the optimized structure
  const profileImageUrl =
    getProfileImageUrl(user) ||
    user.profileImage?.url ||
    (user.username
      ? `/placeholder.svg?height=150&width=150&query=profile+${encodeURIComponent(user.username)}`
      : `/placeholder.svg?height=150&width=150&query=profile+user`)

  // Extract cover image URL using the helper function or directly from the optimized structure
  const coverImageUrl =
    getCoverImageUrl(user) ||
    user.coverImage?.url ||
    (user.username
      ? `/placeholder.svg?height=400&width=1200&query=cover+${encodeURIComponent(user.username)}`
      : `/placeholder.svg?height=400&width=1200&query=cover+background`)

  // Process image URLs on the server with better fallbacks
  const processedUser = {
    ...user,
    profileImageUrl,
    coverImageUrl,
    isFollowing,
  }

  return <ProfileHeaderClient userData={processedUser} isOtherUser={isOtherUser} />
}
