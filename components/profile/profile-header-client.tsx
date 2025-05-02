"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, Share2, Settings } from "lucide-react"
import { motion } from "framer-motion"
import EditProfileModal from "@/components/profile/edit-profile-modal"
import Link from "next/link"
import { toggleFollow } from "@/lib/user-actions"
import { useToast } from "@/hooks/use-toast"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileHeaderClientProps {
  userData: UserProfileResponse & {
    profileImageUrl: string
    coverImageUrl: string
  }
}

export function ProfileHeaderClient({ userData }: ProfileHeaderClientProps) {
  const [isFollowing, setIsFollowing] = useState(false) // This would come from API in a real app
  const [followerCount, setFollowerCount] = useState(userData.followersCount)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFollowToggle = async () => {
    setIsLoading(true)

    // Optimistic update
    setIsFollowing((prev) => !prev)
    setFollowerCount((prev) => (isFollowing ? prev - 1 : prev + 1))

    try {
      const result = await toggleFollow(userData.username, isFollowing)

      if (!result.success) {
        // Revert optimistic update if failed
        setIsFollowing(isFollowing)
        setFollowerCount(userData.followersCount)

        toast({
          title: "Error",
          description: result.message || "Failed to update follow status",
          variant: "destructive",
        })
      } else if (result.newFollowerCount) {
        // Update with actual count from server
        setFollowerCount(result.newFollowerCount)
      }
    } catch (error) {
      // Revert optimistic update if error
      setIsFollowing(isFollowing)
      setFollowerCount(userData.followersCount)

      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="relative">
        {/* Cover Image */}
        <div className="h-40 md:h-60 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 relative overflow-hidden">
          {userData.coverImageUrl ? (
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage: `url('${userData.coverImageUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                maxWidth: "100%", // Ensure image doesn't exceed container width
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage: "url('/nail-pattern-bg.png')",
                backgroundSize: "cover",
                maxWidth: "100%", // Ensure image doesn't exceed container width
              }}
            />
          )}

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/80 backdrop-blur-sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Link href="/settings/account">
              <Button variant="secondary" size="sm" className="bg-white/80 backdrop-blur-sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </Link>
            <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Avatar - positioned to overlap the cover image */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16 md:-bottom-20">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-full p-1 bg-white shadow-lg">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white">
                <AvatarImage
                  src={userData.profileImageUrl || "/placeholder.svg"}
                  alt={userData.username}
                  className="object-cover" // Ensure proper image scaling
                />
                <AvatarFallback>{userData.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            {userData.isVerified && (
              <div className="absolute bottom-2 right-2 bg-pink-500 text-white rounded-full p-1 border-2 border-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Spacer for avatar overflow */}
      <div className="h-16 md:h-20"></div>

      {/* User Info */}
      <div className="text-center px-4 pb-6">
        <h1 className="text-2xl font-bold">{userData.displayName || userData.username}</h1>
        <p className="text-gray-500 text-sm">@{userData.username}</p>

        <div className="mt-4 max-w-md mx-auto">
          <p className="text-sm whitespace-pre-wrap">{userData.bio}</p>
          {userData.website && (
            <a
              href={`https://${userData.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-pink-500 font-medium mt-1 inline-block"
            >
              {userData.website}
            </a>
          )}
          {userData.location && (
            <p className="text-sm text-gray-500 mt-1">
              <span>📍 {userData.location}</span>
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant={isFollowing ? "outline" : "default"}
            className={isFollowing ? "rounded-full px-6" : "rounded-full px-6 bg-pink-500 hover:bg-pink-600"}
            onClick={handleFollowToggle}
            disabled={isLoading}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
          <Button variant="outline" className="rounded-full px-6">
            Message
          </Button>
        </div>
      </div>

      {showEditModal && <EditProfileModal user={userData} onClose={() => setShowEditModal(false)} />}
    </>
  )
}
