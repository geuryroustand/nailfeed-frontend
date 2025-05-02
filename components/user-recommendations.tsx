"use client"

import { Suspense } from "react"
import { getRecommendedUsers } from "@/lib/recommendation-actions"
import UserRecommendationsClient from "./user-recommendations-client"
import UserRecommendationsSkeleton from "./user-recommendations-skeleton"

interface UserRecommendationsProps {
  compact?: boolean
}

const recommendedUsers = [
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

export default async function UserRecommendations({ compact = false }: UserRecommendationsProps) {
  // Fetch recommended users on the server
  const recommendedUsers = await getRecommendedUsers()

  return (
    <Suspense fallback={<UserRecommendationsSkeleton compact={compact} />}>
      <UserRecommendationsClient recommendedUsers={recommendedUsers} compact={compact} />
    </Suspense>
  )
}
