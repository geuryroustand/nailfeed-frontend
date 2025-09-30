import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Users, ChevronDown } from "lucide-react"
import { FollowListsSkeleton } from "./profile-skeleton"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// Remove direct import since we'll use client-side functions in the client component
import FollowListClientV2 from "./follow-list-client-v2"

interface FollowListsV2Props {
  username: string
  documentId: string
  isOwnProfile: boolean
  followersCount: number
  followingCount: number
  initialTab?: "followers" | "following"
}

interface FollowListsContentProps {
  username: string
  documentId: string
  isOwnProfile: boolean
  followersCount: number
  followingCount: number
  initialTab: "followers" | "following"
}

function FollowListsContent({
  username,
  documentId,
  isOwnProfile,
  followersCount,
  followingCount,
  initialTab,
}: FollowListsContentProps) {
  // Since we're moving to client-side fetching for the lists,
  // we'll start with empty data and let the client components fetch

  return (
    <div className="p-6">
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
          <TabsTrigger
            value="followers"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <span>Followers</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
              {followersCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <span>Following</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
              {followingCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="mt-6">
          <FollowListClientV2
            type="followers"
            initialData={[]}
            pagination={null}
            targetUserId={isOwnProfile ? undefined : documentId}
            username={username}
            isOwnProfile={isOwnProfile}
          />
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          <FollowListClientV2
            type="following"
            initialData={[]}
            pagination={null}
            targetUserId={isOwnProfile ? undefined : documentId}
            username={username}
            isOwnProfile={isOwnProfile}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function FollowListsV2({
  username,
  documentId,
  isOwnProfile,
  followersCount,
  followingCount,
  initialTab = "followers",
}: FollowListsV2Props) {
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{followersCount} followers</span>
                <span>•</span>
                <span>{followingCount} following</span>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-gray-100">
          <Suspense fallback={<FollowListsSkeleton />}>
            <FollowListsContent
              username={username}
              documentId={documentId}
              isOwnProfile={isOwnProfile}
              followersCount={followersCount}
              followingCount={followingCount}
              initialTab={initialTab}
            />
          </Suspense>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
