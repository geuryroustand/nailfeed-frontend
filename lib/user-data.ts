// Server-side data fetching for user profile data

export type UserProfile = {
  username: string
  displayName: string
  bio: string
  website: string
  location: string
  avatar: string
  isVerified: boolean
  isFollowing: boolean
  stats: {
    posts: number
    followers: number
    following: number
  }
  engagement: {
    likes: number
    comments: number
    saves: number
  }
  profileImage?: {
    url: string
  }
}

export async function getUserProfile(username?: string): Promise<UserProfile> {
  // In a real app, this would fetch from a database based on the username
  // For now, we'll return mock data

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    username: "nailartist",
    displayName: "Sophia Lee",
    bio: "Nail artist & educator 💅 | Specializing in hand-painted designs | For bookings: nailartist@example.com",
    website: "nailartist.com",
    location: "Los Angeles, CA",
    avatar: "/serene-woman-gaze.png",
    isVerified: true,
    isFollowing: false,
    stats: {
      posts: 142,
      followers: 24800,
      following: 856,
    },
    engagement: {
      likes: 45600,
      comments: 3200,
      saves: 2800,
    },
    profileImage: {
      url: "/serene-woman-gaze.png",
    },
  }
}

export type FollowActionResult = {
  success: boolean
  isFollowing: boolean
  newFollowerCount?: number
  message?: string
}

export type ProfileUpdateResult = {
  success: boolean
  message?: string
  user?: Partial<UserProfile>
}

export type RecommendedUser = {
  id: number
  username: string
  image: string
  bio: string
  profileImage?: {
    url: string
  }
}

export async function getFeaturedUsers(): Promise<RecommendedUser[]> {
  // In a real app, this would fetch from a database
  // Simulate a database fetch with some delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  return [
    {
      id: 1,
      username: "nailpro",
      image: "/vibrant-nail-studio.png",
      bio: "Professional nail artist",
      profileImage: {
        url: "/vibrant-nail-studio.png",
      },
    },
    {
      id: 2,
      username: "artsynails",
      image: "/vibrant-artist-portrait.png",
      bio: "Creative nail designs",
      profileImage: {
        url: "/vibrant-artist-portrait.png",
      },
    },
    {
      id: 3,
      username: "nailinspo",
      image: "/vibrant-beauty-vlogger.png",
      bio: "Daily nail inspiration",
      profileImage: {
        url: "/vibrant-beauty-vlogger.png",
      },
    },
  ]
}
