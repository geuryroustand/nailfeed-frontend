import { Suspense } from "react"
import { ProfileHeaderClient } from "@/components/profile/profile-header-client"
import { checkFollowStatus } from "@/lib/actions/profile-server-actions"
import { getProfileImageUrl, getCoverImageUrl } from "@/lib/server-image-utils"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileHeaderServerProps {
  user: UserProfileResponse
  isOtherUser?: boolean
}

export async function ProfileHeaderServer({ user, isOtherUser = false }: ProfileHeaderServerProps) {
  // Process images on server side for better performance
  const profileImageUrl = getProfileImageUrl(user)
  const coverImageUrl = getCoverImageUrl(user)

  // Check follow status if viewing another user's profile
  let isFollowing = false
  if (isOtherUser) {
    try {
      const followStatus = await checkFollowStatus(user.username)
      isFollowing = followStatus.isFollowing
    } catch (error) {
      console.error("Error checking follow status:", error)
      // Continue with default value
    }
  }

  // Prepare optimized user data for client component
  const optimizedUserData = {
    ...user,
    profileImageUrl,
    coverImageUrl,
    isFollowing,
    // Ensure stats are properly formatted
    followersCount: user.followersCount || user.stats?.followers || 0,
    followingCount: user.followingCount || user.stats?.following || 0,
    postsCount: user.postsCount || user.stats?.posts || 0,
  }

  return (
    <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse" />}>
      <ProfileHeaderClient userData={optimizedUserData} isOtherUser={isOtherUser} />
    </Suspense>
  )
}
