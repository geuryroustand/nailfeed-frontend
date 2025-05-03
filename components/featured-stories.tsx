import { FeaturedStoriesClient } from "./featured-stories-client";

// Static data for testing
const staticStories = [
  {
    id: 1,
    title: "Featured Story 1",
    image: "/sample-nails-1.jpg",
    description: "Beautiful spring nails with floral design",
  },
  {
    id: 2,
    title: "Featured Story 2",
    image: "/sample-nails-2.jpg",
    description: "Elegant French manicure with gold accents",
  },
];

export default function FeaturedStories() {
  // Comment out data fetching for now
  // const stories = await fetchFeaturedStories()

  // Use static data instead
  return <FeaturedStoriesClient stories={staticStories} />;
}
