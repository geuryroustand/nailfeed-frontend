"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, Share2, Settings, PlusCircle } from "lucide-react"
import { motion } from "framer-motion"
import EditProfileModal from "@/components/profile/edit-profile-modal"
import Link from "next/link"
import { toggleFollow } from "@/lib/user-actions"
import { useToast } from "@/hooks/use-toast"
import type { UserProfileResponse } from "@/lib/services/user-service"
import CreatePostModal from "@/components/create-post-modal"

interface ProfileHeaderClientProps {
  userData: UserProfileResponse & {
    profileImageUrl: string
    coverImageUrl: string
    isFollowing?: boolean
    followersCount: number
    followingCount: number
  }
  isOtherUser: boolean
}

export function ProfileHeaderClient({ userData, isOtherUser }: ProfileHeaderClientProps) {
  const [isFollowing, setIsFollowing] = useState(userData.isFollowing || false)
  const [followerCount, setFollowerCount] = useState(userData.followersCount || 0)
  const [followingCount, setFollowingCount] = useState(userData.followingCount || 0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreatePostModal, setShowCreatePostModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Update state if props change, ensuring we always have values
  useEffect(() => {
    setIsFollowing(userData.isFollowing || false)
    // Only update if we have valid values
    if (userData.followersCount !== undefined) {
      setFollowerCount(userData.followersCount)
    }
    if (userData.followingCount !== undefined) {
      setFollowingCount(userData.followingCount)
    }
  }, [userData.isFollowing, userData.followersCount, userData.followingCount])

  const handleFollowToggle = async () => {
    if (!isOtherUser) return // Don't allow following yourself

    setIsLoading(true)

    // Store current state for potential revert
    const previousFollowState = isFollowing
    const previousFollowerCount = followerCount

    // Optimistic update
    const newFollowState = !isFollowing
    setIsFollowing(newFollowState)
    setFollowerCount((prev) => (newFollowState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      // Call server action - it will determine the correct action based on database state
      const result = await toggleFollow(userData.username)

      if (!result.success) {
        // Revert optimistic update if failed
        setIsFollowing(previousFollowState)
        setFollowerCount(previousFollowerCount)

        toast({
          title: "Error",
          description: result.message || "Failed to update follow status",
          variant: "destructive",
        })
      } else {
        // Update with actual state from server (in case of race conditions)
        setIsFollowing(result.isFollowing)
        if (result.newFollowerCount !== undefined) {
          setFollowerCount(result.newFollowerCount)
        }

        // Show success message
        toast({
          title: result.isFollowing ? "Following" : "Unfollowed",
          description: result.isFollowing
            ? `You are now following ${userData.displayName || userData.username}`
            : `You unfollowed ${userData.displayName || userData.username}`,
        })
      }
    } catch (error) {
      // Revert optimistic update if error
      setIsFollowing(previousFollowState)
      setFollowerCount(previousFollowerCount)

      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostCreated = (newPost: any) => {
    // Show success toast
    toast({
      title: "Post created!",
      description: "Your post has been published successfully.",
    })

    // Refresh the page to show the new post
    // A more sophisticated approach would update the state
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // Helper function to check if a field has real user content (not placeholder)
  const hasRealContent = (field?: string): boolean => {
    // Return false if field doesn't exist or is empty
    if (!field || field.trim() === "") return false

    // List of specific placeholder texts to filter out
    const placeholderTexts = [
      "Updated bio information",
      "New Location",
      "placeholder",
      "example",
      "sample",
      "your bio",
      "your location",
      "add your",
    ]

    // Check if the field contains any of the placeholder texts
    return !placeholderTexts.some((text) => field.toLowerCase().includes(text.toLowerCase()))
  }

  // Debug userData when it changes
  useEffect(() => {
    console.log("ProfileHeaderClient - userData:", userData)
    console.log("ProfileHeaderClient - coverImageUrl:", userData.coverImageUrl)
  }, [userData])

  return (
    <>
      <div className="relative">
        {/* Cover Image */}
        <div className="h-40 md:h-60 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 relative overflow-hidden">
          {console.log("Cover Image URL:", userData.coverImageUrl)}
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
            {!isOtherUser && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm"
                  onClick={() => setShowCreatePostModal(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Post
                </Button>
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
              </>
            )}
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
                  src={userData.profileImageUrl || ""}
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

        {/* Follower and Following Counts - Always visible to all users */}
        <div className="flex justify-center gap-6 mt-3">
          <div className="text-center">
            <p className="font-semibold">
              {followerCount !== undefined
                ? followerCount.toLocaleString()
                : (userData.followersCount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">
              {followingCount !== undefined
                ? followingCount.toLocaleString()
                : (userData.followingCount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">{userData.postsCount?.toLocaleString() || "0"}</p>
            <p className="text-xs text-gray-500">Posts</p>
          </div>
        </div>

        <div className="mt-4 max-w-md mx-auto">
          {/* Display bio if it has real content (not placeholder) */}
          {hasRealContent(userData.bio) && <p className="text-sm whitespace-pre-wrap">{userData.bio}</p>}

          {/* Only display website if it has content */}
          {hasRealContent(userData.website) && (
            <a
              href={userData.website.startsWith("http") ? userData.website : `https://${userData.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-pink-500 font-medium mt-1 inline-block"
            >
              {userData.website.replace(/^https?:\/\//, "")}
            </a>
          )}

          {/* Only display location if it has real content (not placeholder) */}
          {hasRealContent(userData.location) && (
            <p className="text-sm text-gray-500 mt-1">
              <span>📍 {userData.location}</span>
            </p>
          )}
        </div>

        {isOtherUser && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant={isFollowing ? "outline" : "default"}
              className={isFollowing ? "rounded-full px-6" : "rounded-full px-6 bg-pink-500 hover:bg-pink-600"}
              onClick={handleFollowToggle}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : isFollowing ? "Following" : "Follow"}
            </Button>
            <Button variant="outline" className="rounded-full px-6 bg-transparent">
              Message
            </Button>
          </div>
        )}
      </div>

      {showEditModal && <EditProfileModal user={userData} onClose={() => setShowEditModal(false)} />}
      {showCreatePostModal && (
        <CreatePostModal onClose={() => setShowCreatePostModal(false)} onPostCreated={handlePostCreated} />
      )}
    </>
  )
}
