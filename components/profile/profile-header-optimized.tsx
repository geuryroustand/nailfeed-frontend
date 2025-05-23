import { ProfileHeaderClient } from "@/components/profile/profile-header-client"
import type { UserProfileResponse } from "@/lib/services/user-service"
import { getProfileImageUrl, getCoverImageUrl } from "@/lib/server-image-utils"

interface ProfileHeaderOptimizedProps {
  user: UserProfileResponse
  isOtherUser?: boolean
}

export function ProfileHeaderOptimized({ user, isOtherUser = false }: ProfileHeaderOptimizedProps) {
  if (!user) {
    return <div className="p-4 text-center">Error loading profile data</div>
  }

  // Process image URLs on the server with better fallbacks
  const profileImageUrl = getProfileImageUrl(user)
  const coverImageUrl = getCoverImageUrl(user)

  // Process the user data on the server
  const processedUser = {
    ...user,
    profileImageUrl,
    coverImageUrl,
  }

  return <ProfileHeaderClient userData={processedUser} isOtherUser={isOtherUser} />
}
