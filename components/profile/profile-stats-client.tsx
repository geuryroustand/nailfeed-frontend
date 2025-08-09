"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProfileStatsClientProps {
  stats: {
    followersCount: number
    followingCount: number
    postsCount: number
    engagement?: {
      likes: number
      comments: number
      saves: number
    }
  }
}

export function ProfileStatsClient({ stats }: ProfileStatsClientProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="border-t border-b border-gray-200">
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.postsCount}</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.followersCount}</p>
              <p className="text-sm text-gray-500">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.followingCount}</p>
              <p className="text-sm text-gray-500">Following</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="followers" className="px-4 py-6">
          <div className="text-center py-4">
            <p className="text-lg font-medium">{stats.followersCount} Followers</p>
            {stats.followersCount === 0 ? (
              <p className="text-sm text-gray-500 mt-2">You don't have any followers yet.</p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">People who follow your profile</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="engagement" className="px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.engagement?.likes || 0}</p>
              <p className="text-sm text-gray-500">Likes</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.engagement?.comments || 0}</p>
              <p className="text-sm text-gray-500">Comments</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.engagement?.saves || 0}</p>
              <p className="text-sm text-gray-500">Saves</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
