import { Suspense } from "react"
import { ProfileStatsClient } from "@/components/profile/profile-stats-client"
import { getProfileEngagementStats } from "@/lib/actions/profile-server-actions"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileStatsServerProps {
  user: UserProfileResponse
}

export async function ProfileStatsServerEnhanced({ user }: ProfileStatsServerProps) {
  return (
    <div className="border-t border-b border-gray-200">
      <Suspense fallback={<ProfileStatsServerSkeleton />}>
        <ProfileStatsContent user={user} />
      </Suspense>
    </div>
  )
}

async function ProfileStatsContent({ user }: { user: UserProfileResponse }) {
  try {
    // Fetch enhanced engagement stats
    const engagementStats = await getProfileEngagementStats(user.username)

    // Prepare stats data with enhanced engagement metrics
    const statsData = {
      followersCount: user.followersCount || user.stats?.followers || 0,
      followingCount: user.followingCount || user.stats?.following || 0,
      postsCount: user.postsCount || user.stats?.posts || 0,
      engagement: engagementStats || {
        likes: user.engagement?.likes || 0,
        comments: user.engagement?.comments || 0,
        saves: user.engagement?.saves || 0,
      },
    }

    return <ProfileStatsClient stats={statsData} username={user.username} documentId={user.documentId} isOwnProfile={true} />
  } catch (error) {
    console.error("Error loading profile stats:", error)

    // Fallback to basic stats
    const basicStats = {
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      postsCount: user.postsCount || 0,
      engagement: { likes: 0, comments: 0, saves: 0 },
    }

    return <ProfileStatsClient stats={basicStats} username={user.username} documentId={user.documentId} isOwnProfile={true} />
  }
}

function ProfileStatsServerSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4 text-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-6 w-12 bg-gray-200 rounded mx-auto mb-1" />
            <div className="h-4 w-16 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
