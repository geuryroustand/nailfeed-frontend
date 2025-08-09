"use client"
import Link from "next/link"
import { getTrendingTags } from "@/lib/actions/explore-server-actions"
import ExploreTrendingClient from "./explore-trending-client"

export default async function ExploreTrendingServer() {
  const trendingTags = await getTrendingTags()

  if (!trendingTags || trendingTags.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Trending Now</h2>
        <Link href="/explore/trending" className="text-sm text-pink-500 font-medium">
          See All
        </Link>
      </div>

      <ExploreTrendingClient trendingTags={trendingTags} />
    </div>
  )
}
