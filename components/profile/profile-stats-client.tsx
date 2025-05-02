"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileStatsClientProps {
  userData: UserProfileResponse
}

export function ProfileStatsClient({ userData }: ProfileStatsClientProps) {
  const [activeTab, setActiveTab] = useState("posts")

  return (
    <div className="border-t border-gray-200 mt-6">
      <Tabs defaultValue="posts" className="w-full" onValueChange={setActiveTab}>
        <div className="border-b border-gray-200">
          <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-transparent h-auto p-0">
            <TabsTrigger
              value="posts"
              className={`rounded-none border-b-2 px-6 py-3 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
                activeTab === "posts" ? "border-pink-500 font-medium" : "border-transparent"
              }`}
            >
              <span className="mr-1 font-medium">{userData.postsCount}</span>
              <span className="text-gray-500">Posts</span>
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className={`rounded-none border-b-2 px-6 py-3 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
                activeTab === "followers" ? "border-pink-500 font-medium" : "border-transparent"
              }`}
            >
              <span className="mr-1 font-medium">{userData.followersCount}</span>
              <span className="text-gray-500">Followers</span>
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className={`rounded-none border-b-2 px-6 py-3 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
                activeTab === "following" ? "border-pink-500 font-medium" : "border-transparent"
              }`}
            >
              <span className="mr-1 font-medium">{userData.followingCount}</span>
              <span className="text-gray-500">Following</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="posts" className="mt-0 p-0">
          {/* Posts content is rendered by ProfileGallery component */}
        </TabsContent>

        <TabsContent value="followers" className="mt-0 p-4">
          <div className="text-center py-8 text-gray-500">
            <p>Followers will be displayed here</p>
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-0 p-4">
          <div className="text-center py-8 text-gray-500">
            <p>Following users will be displayed here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
