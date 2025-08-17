"use client"

import { useState, Suspense } from "react"
import FollowLists from "@/components/profile/follow-lists"
import { FollowListsSkeleton } from "@/components/profile/profile-skeleton"

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
  username: string
  isOwnProfile: boolean
}

export function ProfileStatsClient({ stats, username, isOwnProfile }: ProfileStatsClientProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <Suspense fallback={<FollowListsSkeleton />}>
        <FollowLists username={username} isOwnProfile={isOwnProfile} initialTab="followers" />
      </Suspense>
    </div>
  )
}
