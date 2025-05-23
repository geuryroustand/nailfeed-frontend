import { fetchTrendingTags, fetchSuggestedUsers, fetchUserCollections } from "@/lib/data"
import { TrendingSectionClient } from "./trending-section-client"

export default async function TrendingSection() {
  // Fetch data in parallel for better performance
  const [trendingTags, suggestedUsers, userCollections] = await Promise.all([
    fetchTrendingTags(),
    fetchSuggestedUsers(),
    fetchUserCollections(),
  ])

  // Pass data to client component
  return (
    <TrendingSectionClient
      trendingTags={trendingTags}
      suggestedUsers={suggestedUsers}
      userCollections={userCollections}
    />
  )
}
