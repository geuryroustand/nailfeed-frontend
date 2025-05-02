"use client"
import { UserRecommendations } from "@/components/user-recommendations"
import TrendingReactions from "@/components/trending-reactions"

export function RightSidebar() {
  return (
    <div className="w-full space-y-4">
      <TrendingReactions />
      <UserRecommendations />
    </div>
  )
}
