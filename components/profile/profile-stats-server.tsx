import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileStatsServerProps {
  user: UserProfileResponse
}

export function ProfileStatsServer({ user }: ProfileStatsServerProps) {
  if (!user) {
    return <div className="p-4 text-center">Error loading profile stats</div>
  }

  // Extract the stats data from the user object with safe defaults
  const statsData = {
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
    postsCount: user.postsCount || 0,
    engagement: user.engagement || { likes: 0, comments: 0, saves: 0 },
  }

  // Ensure engagement object has all required properties
  if (!statsData.engagement.likes) statsData.engagement.likes = 0
  if (!statsData.engagement.comments) statsData.engagement.comments = 0
  if (!statsData.engagement.saves) statsData.engagement.saves = 0

  return (
    <div className="border-t border-b border-gray-200 py-4 px-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xl font-semibold">{statsData.postsCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold">{statsData.followersCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold">{statsData.followingCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Following</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Engagement</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-medium">{statsData.engagement.likes.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium">{statsData.engagement.comments.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium">{statsData.engagement.saves.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Saves</div>
          </div>
        </div>
      </div>
    </div>
  )
}
