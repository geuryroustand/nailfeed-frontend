import { ProfileHeaderClient } from "@/components/profile/profile-header-client"
import type { UserProfileResponse } from "@/lib/services/user-service"
import { getProfileImageUrl, getCoverImageUrl } from "@/lib/api-url-helper"

// Add isOtherUser prop to the component props
interface ProfileHeaderProps {
  user: UserProfileResponse
  isOtherUser?: boolean
}

export default function ProfileHeader({ user, isOtherUser = false }: ProfileHeaderProps) {
  if (!user) {
    return <div className="p-4 text-center">Error loading profile data</div>
  }

  // Get the API base URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

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

  // Log the raw cover image data for debugging
  console.log("Raw cover image data:", user.coverImage)

  // Process image URLs on the server with better fallbacks
  const processedUser = {
    ...user,
    profileImageUrl,
    coverImageUrl,
  }

  // Log the processed image URLs for debugging
  console.log("Profile Header - Processed image URLs:", {
    profileImageUrl,
    coverImageUrl,
    originalProfileImage: user.profileImage?.url,
    originalCoverImage: user.coverImage?.url,
  })

  return <ProfileHeaderClient userData={processedUser} isOtherUser={isOtherUser} />
}
