import { ProfileHeaderClient } from "@/components/profile/profile-header-client"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileHeaderProps {
  user: UserProfileResponse
}

// This is now a proper Server Component that passes data to the client component
export default function ProfileHeader({ user }: ProfileHeaderProps) {
  // Process data on the server before passing to client
  const apiBaseUrl = "https://nailfeed-backend-production.up.railway.app"

  // Construct absolute URLs for profile and cover images on the server
  const getFullImageUrl = (relativeUrl: string | undefined) => {
    if (!relativeUrl) return undefined
    // If the URL already starts with http, it's already absolute
    if (relativeUrl.startsWith("http")) return relativeUrl
    // Otherwise, prepend the API base URL
    return `${apiBaseUrl}${relativeUrl}`
  }

  // Process image URLs on the server
  const processedUser = {
    ...user,
    profileImageUrl: getFullImageUrl(user.profileImage?.url) || "/placeholder.svg",
    coverImageUrl: getFullImageUrl(user.coverImage?.url) || "/nail-pattern-bg.png",
  }

  return <ProfileHeaderClient userData={processedUser} />
}
