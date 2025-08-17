import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFollowers, getFollowing } from "@/lib/services/user-network-service"
import FollowListClient from "./follow-list-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Users, ChevronDown } from "lucide-react"
import { FollowListsSkeleton } from "./profile-skeleton"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
    <Collapsible defaultOpen={false} className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 rounded-none"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Network</h2>
            </div>
            <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-gray-100">
          <Suspense fallback={<FollowListsSkeleton />}>
            <FollowListsContent
              username={username}
              initialTab={initialTab}
              isOwnProfile={isOwnProfile}
              prefetchedFollowers={prefetchedFollowers}
              prefetchedFollowing={prefetchedFollowing}
            />
          </Suspense>
        </CollapsibleContent>
      </div>
    </Collapsible>
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

        <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 m-4 rounded-lg">
              <TabsTrigger
                value="followers"
                className="py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Followers ({followersData.total.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Following ({followingData.total.toLocaleString()})
              </TabsTrigger>
            </TabsList>

            <div className="max-h-96 overflow-y-auto">
              <TabsContent value="followers" className="p-4 pt-0 m-0">
                <FollowListClient
                  initialData={followersData}
                  fetchFunction={getFollowers}
                  username={username}
                  listType="followers"
                  isOwnProfile={isOwnProfile}
                />
              </TabsContent>
              <TabsContent value="following" className="p-4 pt-0 m-0">
                <FollowListClient
                  initialData={followingData}
                  fetchFunction={getFollowing}
                  username={username}
                  listType="following"
                  isOwnProfile={isOwnProfile}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
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
    <Alert className="m-4 bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-500" />
      <AlertDescription className="text-blue-700">No follower or following data found for this user.</AlertDescription>
    </Alert>
  )
}

function FollowListError() {
  return (
    <div className="p-8 text-center">
      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load network data</h3>
      <p className="text-gray-500 mb-4">
        We encountered an error while loading the followers and following lists. Please try again later.
      </p>
    </div>
  )
}
