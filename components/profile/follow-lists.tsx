import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFollowers, getFollowing } from "@/lib/services/user-network-service"
import FollowListClient from "./follow-list-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { FollowListsSkeleton } from "./profile-skeleton"

interface FollowListsProps {
  username: string
  initialTab?: "followers" | "following"
  isOwnProfile: boolean
  followers?: any[]
  following?: any[]
}

export default async function FollowLists({
  username,
  initialTab = "followers",
  isOwnProfile,
  followers: prefetchedFollowers,
  following: prefetchedFollowing,
}: FollowListsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold px-4 pt-4">Network</h2>
      <Suspense fallback={<FollowListsSkeleton />}>
        <FollowListsContent
          username={username}
          initialTab={initialTab}
          isOwnProfile={isOwnProfile}
          prefetchedFollowers={prefetchedFollowers}
          prefetchedFollowing={prefetchedFollowing}
        />
      </Suspense>
    </div>
  )
}

async function FollowListsContent({
  username,
  initialTab,
  isOwnProfile,
  prefetchedFollowers,
  prefetchedFollowing,
}: {
  username: string
  initialTab: "followers" | "following"
  isOwnProfile: boolean
  prefetchedFollowers?: any[]
  prefetchedFollowing?: any[]
}) {
  try {
    // Use pre-fetched data if available, otherwise fetch from API
    const followersData = await getFollowersData(username, prefetchedFollowers)
    const followingData = await getFollowingData(username, prefetchedFollowing)

    // Check if we have any data
    const hasFollowers = followersData.users.length > 0
    const hasFollowing = followingData.users.length > 0
    const hasNoData = !hasFollowers && !hasFollowing

    return (
      <>
        {hasNoData && <NoDataAlert />}

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="py-3">
              Followers ({followersData.total})
            </TabsTrigger>
            <TabsTrigger value="following" className="py-3">
              Following ({followingData.total})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="p-4">
            <FollowListClient
              initialData={followersData}
              fetchFunction={getFollowers}
              username={username}
              listType="followers"
              isOwnProfile={isOwnProfile}
            />
          </TabsContent>
          <TabsContent value="following" className="p-4">
            <FollowListClient
              initialData={followingData}
              fetchFunction={getFollowing}
              username={username}
              listType="following"
              isOwnProfile={isOwnProfile}
            />
          </TabsContent>
        </Tabs>
      </>
    )
  } catch (error) {
    console.error("Error in FollowListsContent:", error)
    return <FollowListError />
  }
}

async function getFollowersData(username: string, prefetchedFollowers?: any[]) {
  if (prefetchedFollowers) {
    return {
      users: prefetchedFollowers,
      total: prefetchedFollowers.length,
      page: 1,
      pageSize: prefetchedFollowers.length,
      totalPages: 1,
      usingSampleData: false,
    }
  }

  const data = await getFollowers(username, 1, 10)
  return (
    data || {
      users: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      usingSampleData: false,
    }
  )
}

async function getFollowingData(username: string, prefetchedFollowing?: any[]) {
  if (prefetchedFollowing) {
    return {
      users: prefetchedFollowing,
      total: prefetchedFollowing.length,
      page: 1,
      pageSize: prefetchedFollowing.length,
      totalPages: 1,
      usingSampleData: false,
    }
  }

  const data = await getFollowing(username, 1, 10)
  return (
    data || {
      users: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      usingSampleData: false,
    }
  )
}

function NoDataAlert() {
  return (
    <Alert className="m-4 bg-yellow-50 border-yellow-200">
      <AlertCircle className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="text-yellow-700">
        No follower or following data found for this user.
      </AlertDescription>
    </Alert>
  )
}

function FollowListError() {
  return (
    <div className="p-8 text-center">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load network data</h3>
      <p className="text-gray-500 mb-4">
        We encountered an error while loading the followers and following lists. Please try again later.
      </p>
    </div>
  )
}
