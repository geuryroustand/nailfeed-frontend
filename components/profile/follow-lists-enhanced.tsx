"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserPlus } from "lucide-react"
import FollowListInfinite from "./follow-list-infinite"

interface FollowListsEnhancedProps {
  username: string
  documentId: string
  isOwnProfile: boolean
  followersCount: number
  followingCount: number
}

export default function FollowListsEnhanced({
  username,
  documentId,
  isOwnProfile,
  followersCount,
  followingCount,
}: FollowListsEnhancedProps) {
  const [selectedTab, setSelectedTab] = useState<"followers" | "following">("followers")

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with network stats */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Network</h2>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTab("followers")}
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
              <FollowListInfinite
                type="followers"
                targetUserId={documentId}
                username={username}
                isOwnProfile={isOwnProfile}
              />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTab("following")}
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
              <FollowListInfinite
                type="following"
                targetUserId={documentId}
                username={username}
                isOwnProfile={isOwnProfile}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Preview section - show a few users */}
      <div className="p-6">
        <div className="text-sm text-gray-600 mb-3">
          Recent connections
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FollowListInfinite
            type="followers"
            targetUserId={documentId}
            username={username}
            isOwnProfile={isOwnProfile}
            preview={true}
            maxItems={3}
          />
          <FollowListInfinite
            type="following"
            targetUserId={documentId}
            username={username}
            isOwnProfile={isOwnProfile}
            preview={true}
            maxItems={3}
          />
        </div>
      </div>
    </div>
  )
}
