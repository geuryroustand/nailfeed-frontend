import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFollowers, getFollowing } from "@/lib/services/user-network-service"
import FollowListClient from "./follow-list-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface FollowListsProps {
  username: string
  initialTab?: "followers" | "following"
  isOwnProfile: boolean
  followers?: any[] // Optional pre-fetched followers
  following?: any[] // Optional pre-fetched following
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
      <Suspense fallback={<FollowListsLoading />}>
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
    let followersData
    let followingData

    if (prefetchedFollowers) {
      // Use pre-fetched followers data
      followersData = {
        users: prefetchedFollowers,
        total: prefetchedFollowers.length,
        page: 1,
        pageSize: prefetchedFollowers.length,
        totalPages: 1,
        usingSampleData: false,
      }
      console.log("Using pre-fetched followers data:", followersData.users.length)
    } else {
      // Fetch followers data from API
      followersData = await getFollowers(username, 1, 10)
      console.log("Fetched followers data from API:", followersData?.users?.length || 0)
    }

    if (prefetchedFollowing) {
      // Use pre-fetched following data
      followingData = {
        users: prefetchedFollowing,
        total: prefetchedFollowing.length,
        page: 1,
        pageSize: prefetchedFollowing.length,
        totalPages: 1,
        usingSampleData: false,
      }
      console.log("Using pre-fetched following data:", followingData.users.length)
    } else {
      // Fetch following data from API
      followingData = await getFollowing(username, 1, 10)
      console.log("Fetched following data from API:", followingData?.users?.length || 0)
    }

    // Ensure we have valid data objects even if the API returns nothing
    followersData = followersData || {
      users: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      usingSampleData: false,
    }
    followingData = followingData || {
      users: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      usingSampleData: false,
    }

    // Log the data for debugging
    console.log(
      `Followers data:`,
      JSON.stringify({
        count: followersData.users.length,
        total: followersData.total,
      }),
    )
    console.log(
      `Following data:`,
      JSON.stringify({
        count: followingData.users.length,
        total: followingData.total,
      }),
    )

    // Check if we have any data
    const hasFollowers = followersData.users.length > 0
    const hasFollowing = followingData.users.length > 0
    const hasNoData = !hasFollowers && !hasFollowing

    // If we have no data but the API response shows followers, there might be an issue with processing
    const showDataProcessingAlert = !hasFollowers && (followersData.usingSampleData || followersData.total === 0)

    return (
      <>
        {hasNoData && (
          <Alert className="m-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700">
              No follower or following data found for this user.
            </AlertDescription>
          </Alert>
        )}

        {showDataProcessingAlert && (
          <Alert className="m-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              We're having trouble processing the follower data. Please try again later.
            </AlertDescription>
          </Alert>
        )}

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

function FollowListsLoading() {
  return (
    <div className="p-4">
      <div className="flex justify-center space-x-4 mb-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-10 w-1/2" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="ml-auto">
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
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
