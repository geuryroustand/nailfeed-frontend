import { ProfileStatsClient } from "@/components/profile/profile-stats-client"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileStatsProps {
  user: UserProfileResponse
}

export default function ProfileStats({ user }: ProfileStatsProps) {
  if (!user) {
    return <div className="p-4 text-center">Error loading profile stats</div>
  }

  // Extract the stats data from the user object with safe defaults
  // Use the actual postsCount from the API rather than counting posts array length
  const statsData = {
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
    postsCount: user.postsCount || 0, // Use the postsCount field from the API
    engagement: user.engagement || { likes: 0, comments: 0, saves: 0 },
  }

  // Log the actual values for debugging
  console.log("Profile stats data:", {
    apiPostsCount: user.postsCount,
    postsArrayLength: user.posts?.length,
    usingValue: statsData.postsCount,
  })

  // Ensure engagement object has all required properties
  if (!statsData.engagement.likes) statsData.engagement.likes = 0
  if (!statsData.engagement.comments) statsData.engagement.comments = 0
  if (!statsData.engagement.saves) statsData.engagement.saves = 0

  return <ProfileStatsClient stats={statsData} username={user.username} isOwnProfile={true} />
}
