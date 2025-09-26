"use client"

import { useState } from "react"

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
  documentId: string
  isOwnProfile: boolean
}

export function ProfileStatsClient({ stats, username, documentId, isOwnProfile }: ProfileStatsClientProps) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{stats.postsCount.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Posts</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{stats.followersCount.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Followers</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{stats.followingCount.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Following</div>
        </div>
      </div>
    </div>
  )
}
