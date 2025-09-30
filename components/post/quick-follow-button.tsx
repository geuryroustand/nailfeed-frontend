"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, Check, Loader2 } from "lucide-react"
import { toggleFollow } from "@/lib/user-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface QuickFollowButtonProps {
  username: string
  userDocumentId?: string
  initialIsFollowing?: boolean
  className?: string
}

export function QuickFollowButton({
  username,
  userDocumentId,
  initialIsFollowing = false,
  className = "",
}: QuickFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated } = useAuth() || { isAuthenticated: false }

  const handleFollowClick = async (e: React.MouseEvent) => {
    // Prevent navigation to profile when clicking the button
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      // Redirect to auth page if not logged in
      router.push("/auth")
      return
    }

    if (!username) {
      console.error("[QuickFollowButton] Username is required")
      return
    }

    setIsLoading(true)

    try {
      const result = await toggleFollow(username)

      if (result.success) {
        setIsFollowing(result.isFollowing)

        toast({
          title: result.isFollowing ? "Following" : "Unfollowed",
          description: result.message,
          duration: 2000,
        })

        // Refresh to update follow counts
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update follow status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[QuickFollowButton] Error toggling follow:", error)
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
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollowClick}
      disabled={isLoading}
      className={`
        h-6 px-3 text-xs font-medium rounded-full
        transition-all duration-200
        ${
          isFollowing
            ? "bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            : "bg-pink-500 text-white hover:bg-pink-600 border-0"
        }
        ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          <span className="hidden sm:inline">Processing...</span>
          <span className="sm:hidden">...</span>
        </>
      ) : isFollowing ? (
        <>
          <Check className="h-3 w-3 mr-1" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="h-3 w-3 mr-1" />
          <span>Follow</span>
        </>
      )}
    </Button>
  )
}
