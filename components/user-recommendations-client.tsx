"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { toggleFollowUser, type RecommendedUser, type FollowResult } from "@/lib/recommendation-actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface UserRecommendationsClientProps {
  recommendedUsers: RecommendedUser[]
  compact?: boolean
}

export default function UserRecommendationsClient({
  recommendedUsers,
  compact = false,
}: UserRecommendationsClientProps) {
  const [users, setUsers] = useState<RecommendedUser[]>(recommendedUsers)
  const { toast } = useToast()

  const handleFollow = async (user: RecommendedUser) => {
    // Optimistically update UI
    setUsers((prevUsers) => prevUsers.map((u) => (u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u)))

    try {
      // Call server action
      const result: FollowResult = await toggleFollowUser(user.id, !!user.isFollowing)

      if (!result.success) {
        // Revert optimistic update if server action fails
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === user.id ? { ...u, isFollowing: !!user.isFollowing } : u)),
        )

        // Show error toast
        toast({
          title: "Action failed",
          description: result.message || "Failed to update follow status",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revert optimistic update on error
      setUsers((prevUsers) => prevUsers.map((u) => (u.id === user.id ? { ...u, isFollowing: !!user.isFollowing } : u)))

      // Show error toast
      toast({
        title: "Something went wrong",
        description: "Failed to update follow status",
        variant: "destructive",
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={compact ? "" : "bg-white rounded-lg shadow-sm p-4 mb-6"}
    >
      {!compact && <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested for you</h3>}
      <div className="space-y-3">
        {users.map((user) => (
          <motion.div key={user.id} whileHover={{ x: 2 }} className="flex items-center justify-between">
            <Link href={`/profile/${user.username}`} className="flex items-center space-x-2">
              <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
                <AvatarImage src={user.image || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-gray-500">{user.bio}</p>
              </div>
            </Link>
            <Button
              variant={user.isFollowing ? "outline" : "default"}
              size="sm"
              className={
                user.isFollowing
                  ? "h-8 text-xs"
                  : "h-8 text-xs bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              }
              onClick={() => handleFollow(user)}
            >
              {user.isFollowing ? "Following" : "Follow"}
            </Button>
          </motion.div>
        ))}
      </div>

      {!compact && users.length > 0 && (
        <div className="mt-4">
          <Link href="/explore/users" className="text-sm text-pink-500 font-medium hover:underline">
            See all suggestions
          </Link>
        </div>
      )}
    </motion.div>
  )
}
