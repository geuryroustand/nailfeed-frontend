// Server-side data fetching functions

export async function fetchTrendingTags() {
  // In a real application, this would fetch from a database or API
  // For now, we'll simulate a fetch with the sample data
  return [
    { id: 1, name: "frenchtwist", count: 24500 },
    { id: 2, name: "geometricnails", count: 18200 },
    { id: 3, name: "floralnailart", count: 32100 },
    { id: 4, name: "abstractdesign", count: 15700 },
    { id: 5, name: "minimalistnails", count: 9800 },
  ]
}

export async function fetchSuggestedUsers() {
  return [
    {
      id: 1,
      username: "nailpro",
      image: "/vibrant-nail-studio.png",
      bio: "Professional nail artist",
    },
    {
      id: 2,
      username: "artsynails",
      image: "/vibrant-artist-portrait.png",
      bio: "Creative nail designs",
    },
    {
      id: 3,
      username: "nailinspo",
      image: "/vibrant-beauty-vlogger.png",
      bio: "Daily nail inspiration",
    },
  ]
}

export async function fetchUserCollections() {
  return [
    {
      id: 1,
      name: "Saved Posts",
      itemCount: 12,
      isPrivate: true,
      icon: "bookmark",
      color: "gray",
    },
    {
      id: 2,
      name: "Favorites",
      itemCount: 8,
      isPrivate: true,
      icon: "heart",
      color: "pink",
    },
  ]
}

export async function fetchFeaturedStories() {
  return [
    { id: 1, username: "nailartist", image: "/vibrant-abstract-nails.png", title: "Abstract Vibes" },
    { id: 2, username: "glamnails", image: "/shimmering-gold-flakes.png", title: "Gold Elegance" },
    { id: 3, username: "trendynails", image: "/abstract-pastel-swirls.png", title: "Pastel Dreams" },
    { id: 4, username: "nailpro", image: "/intricate-floral-nails.png", title: "Floral Fantasy" },
    { id: 5, username: "artsynails", image: "/vibrant-floral-nails.png", title: "Spring Bloom" },
    { id: 6, username: "nailinspo", image: "/geometric-harmony.png", title: "Geometric Art" },
  ]
}
