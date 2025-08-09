import { ProfileHeaderClient } from "@/components/profile/profile-header-client"
import type { UserProfileResponse } from "@/lib/services/user-service"
import { getProfileImageUrl, getCoverImageUrl } from "@/lib/api-url-helper"

interface ProfileHeaderProps {
  user: UserProfileResponse
  isOtherUser?: boolean
}

export default function ProfileHeader({ user, isOtherUser = false }: ProfileHeaderProps) {
  if (!user) {
    return <div className="p-4 text-center">Error loading profile data</div>
  }

  // Process image URLs on the server with better fallbacks
  const profileImageUrl =
    getProfileImageUrl(user) ||
    user.profileImage?.url ||
    (user.username
      ? `/placeholder.svg?height=150&width=150&query=profile+${encodeURIComponent(user.username)}`
      : `/placeholder.svg?height=150&width=150&query=profile+user`)

  const coverImageUrl =
    getCoverImageUrl(user) ||
    user.coverImage?.url ||
    (user.username
      ? `/placeholder.svg?height=400&width=1200&query=cover+${encodeURIComponent(user.username)}`
      : `/placeholder.svg?height=400&width=1200&query=cover+background`)

  // Process user data on the server to optimize client-side rendering
  const processedUser = {
    ...user,
    profileImageUrl,
    coverImageUrl,
    // Ensure these properties exist to avoid client-side errors
    followersCount: user.followersCount || user.stats?.followers || 0,
    followingCount: user.followingCount || user.stats?.following || 0,
    postsCount: user.postsCount || user.stats?.posts || 0,
  }

  return <ProfileHeaderClient userData={processedUser} isOtherUser={isOtherUser} />
}
