import { Suspense } from "react"
import { getFollowers, getFollowing } from "@/lib/services/user-network-service"
import FollowLists from "@/components/profile/follow-lists"

interface ProfileNetworkServerProps {
  username: string
  isOwnProfile: boolean
}

export async function ProfileNetworkServer({ username, isOwnProfile }: ProfileNetworkServerProps) {
  return (
    <div className="border-t border-gray-100">
      <Suspense fallback={<ProfileNetworkSkeleton />}>
        <ProfileNetworkContent username={username} isOwnProfile={isOwnProfile} />
      </Suspense>
    </div>
  )
}

async function ProfileNetworkContent({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
  try {
    // Fetch network data in parallel for better performance
    const [followersData, followingData] = await Promise.allSettled([
      getFollowers(username, 1, 10),
      getFollowing(username, 1, 10),
    ])

    const followers = followersData.status === "fulfilled" ? followersData.value?.users || [] : []
    const following = followingData.status === "fulfilled" ? followingData.value?.users || [] : []

    // Only show network section if there's data to display
    if (followers.length === 0 && following.length === 0) {
      return null
    }

    return <FollowLists username={username} isOwnProfile={isOwnProfile} followers={followers} following={following} />
  } catch (error) {
    console.error("Error loading network data:", error)
    return null
  }
}

function ProfileNetworkSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="space-y-1">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="space-y-1">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
