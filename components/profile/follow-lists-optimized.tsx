"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, UserPlus, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import FollowListOptimized from "./follow-list-optimized"
import { fetchNetworkPreview, NetworkData } from "@/lib/services/network-batch-service"

interface FollowListsOptimizedProps {
  username: string
  documentId: string
  isOwnProfile: boolean
  followersCount: number
  followingCount: number
}

export default function FollowListsOptimized({
  username,
  documentId,
  isOwnProfile,
  followersCount,
  followingCount,
}: FollowListsOptimizedProps) {
  const [networkData, setNetworkData] = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch preview data once for both lists
  useEffect(() => {
    const loadNetworkPreview = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchNetworkPreview(documentId, 3)

        if ("error" in result) {
          throw new Error(result.message)
        }

        setNetworkData(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load network data"
        setError(errorMessage)
        console.error("Error loading network preview:", err)
      } finally {
        setLoading(false)
      }
    }

    loadNetworkPreview()
  }, [documentId])

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with network stats */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Network</h2>
        </div>
        <div className="flex items-center gap-4 mt-3">
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
                initialData={networkData?.followers.users || []}
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
                initialData={networkData?.following.users || []}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Preview section */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            <div className="text-sm text-gray-500 mt-2">Loading network...</div>
          </div>
        ) : networkData ? (
          <>
            <div className="text-sm text-gray-600 mb-4">Recent connections</div>
            <div className="grid grid-cols-2 gap-6">
              {/* Followers Preview */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-3">Followers</div>
                {networkData.followers.users.length > 0 ? (
                  <div className="space-y-2">
                    {networkData.followers.users.slice(0, 3).map((user) => (
                      <FollowListOptimized
                        key={`follower-${user.documentId}`}
                        type="followers"
                        targetUserId={documentId}
                        username={username}
                        isOwnProfile={isOwnProfile}
                        initialData={[user]}
                        preview={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 py-4">No followers yet</div>
                )}
              </div>

              {/* Following Preview */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-3">Following</div>
                {networkData.following.users.length > 0 ? (
                  <div className="space-y-2">
                    {networkData.following.users.slice(0, 3).map((user) => (
                      <FollowListOptimized
                        key={`following-${user.documentId}`}
                        type="following"
                        targetUserId={documentId}
                        username={username}
                        isOwnProfile={isOwnProfile}
                        initialData={[user]}
                        preview={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 py-4">Not following anyone yet</div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}