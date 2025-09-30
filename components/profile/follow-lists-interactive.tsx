"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserCheck, UserPlus } from "lucide-react"
import FollowListOptimized from "./follow-list-optimized"
import { NetworkData } from "@/lib/services/network-server-service"

interface FollowListsInteractiveProps {
  username: string
  documentId: string
  isOwnProfile: boolean
  followersCount: number
  followingCount: number
  networkData: NetworkData
}

export default function FollowListsInteractive({
  username,
  documentId,
  isOwnProfile,
  followersCount,
  followingCount,
  networkData,
}: FollowListsInteractiveProps) {
  return (
    <>
      {/* Followers Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <UserCheck className="h-4 w-4" />
            <span className="font-medium">{followersCount.toLocaleString()}</span>
            <span className="text-gray-600">Followers</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Followers ({followersCount.toLocaleString()})
            </DialogTitle>
          </DialogHeader>
          <FollowListOptimized
            type="followers"
            targetUserId={documentId}
            username={username}
            isOwnProfile={isOwnProfile}
            initialData={networkData.followers.users || []}
          />
        </DialogContent>
      </Dialog>

      {/* Following Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <UserPlus className="h-4 w-4" />
            <span className="font-medium">{followingCount.toLocaleString()}</span>
            <span className="text-gray-600">Following</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Following ({followingCount.toLocaleString()})
            </DialogTitle>
          </DialogHeader>
          <FollowListOptimized
            type="following"
            targetUserId={documentId}
            username={username}
            isOwnProfile={isOwnProfile}
            initialData={networkData.following.users || []}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
