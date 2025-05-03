import { TrendingSectionClient } from "./trending-section-client";

// Static data for testing
const staticTrendingTags = [
  { id: 1, name: "spring", count: 120 },
  { id: 2, name: "floral", count: 95 },
  { id: 3, name: "french", count: 80 },
];

const staticSuggestedUsers = [
  {
    id: 1,
    username: "nailartist1",
    image: "/diverse-avatars.png",
    bio: "Professional nail artist specializing in spring designs",
  },
  {
    id: 2,
    username: "nailartist2",
    image: "/diverse-avatars.png",
    bio: "French manicure expert with a modern twist",
  },
  {
    id: 3,
    username: "nailartist3",
    image: "/diverse-avatars.png",
    bio: "Creative nail designs for every occasion",
  },
];

const staticUserCollections = [
  {
    id: 1,
    name: "Spring Collection",
    count: 15,
    itemCount: 15,
    isPrivate: false,
    icon: "🌸",
    color: "pink",
  },
  {
    id: 2,
    name: "Summer Vibes",
    count: 12,
    itemCount: 12,
    isPrivate: false,
    icon: "🌞",
    color: "yellow",
  },
  {
    id: 3,
    name: "Elegant Designs",
    count: 10,
    itemCount: 10,
    isPrivate: false,
    icon: "💎",
    color: "purple",
  },
];

export default function TrendingSection() {
  // Comment out data fetching for now
  // const [trendingTags, suggestedUsers, userCollections] = await Promise.all([
  //   fetchTrendingTags(),
  //   fetchSuggestedUsers(),
  //   fetchUserCollections(),
  // ])

  return (
    <TrendingSectionClient
      trendingTags={staticTrendingTags}
      suggestedUsers={staticSuggestedUsers}
      userCollections={staticUserCollections}
    />
  );
}
