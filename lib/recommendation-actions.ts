"use server"

import { revalidatePath } from "next/cache"

export type RecommendedUser = {
  id: number
  username: string
  image: string
  bio: string
  isFollowing?: boolean
}

export type FollowResult = {
  success: boolean
  userId: number
  isFollowing: boolean
  message?: string
}

// Server action to toggle follow status
export async function toggleFollowUser(userId: number, currentlyFollowing: boolean): Promise<FollowResult> {
  try {
    // In a real app, this would update a database
    console.log(`${currentlyFollowing ? "Unfollowing" : "Following"} user ${userId}`)

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return success response
    const result: FollowResult = {
      success: true,
      userId,
      isFollowing: !currentlyFollowing,
    }

    // Revalidate paths that might show this user
    revalidatePath("/")
    revalidatePath("/explore")
    revalidatePath("/profile")

    return result
  } catch (error) {
    console.error("Error toggling follow status:", error)
    return {
      success: false,
      userId,
      isFollowing: currentlyFollowing,
      message: "Failed to update follow status",
    }
  }
}

// Server function to fetch recommended users
export async function getRecommendedUsers(): Promise<RecommendedUser[]> {
  // In a real app, this would fetch from a database
  // Simulate a database fetch with some delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  return [
    {
      id: 1,
      username: "nailpro",
      image: "/vibrant-nail-studio.png",
      bio: "Professional nail artist",
      isFollowing: false,
    },
    {
      id: 2,
      username: "artsynails",
      image: "/vibrant-artist-portrait.png",
      bio: "Creative nail designs",
      isFollowing: false,
    },
    {
      id: 3,
      username: "nailinspo",
      image: "/vibrant-beauty-vlogger.png",
      bio: "Daily nail inspiration",
      isFollowing: false,
    },
  ]
}
