import { fetchFeaturedStories } from "@/lib/data"
import { FeaturedStoriesClient } from "./featured-stories-client"

export default async function FeaturedStories() {
  // Fetch featured stories data
  const stories = await fetchFeaturedStories()

  // Pass data to client component
  return <FeaturedStoriesClient stories={stories} />
}
