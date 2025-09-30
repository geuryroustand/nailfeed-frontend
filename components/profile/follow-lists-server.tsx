import { Users, UserCheck, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { fetchNetworkPreviewServer, NetworkData } from "@/lib/services/network-server-service"
import FollowListsInteractive from "./follow-lists-interactive"

interface FollowListsServerProps {
  username: string
  documentId: string
  isOwnProfile: boolean
  followersCount: number
  followingCount: number
}

export default async function FollowListsServer({
  username,
  documentId,
  isOwnProfile,
  followersCount,
  followingCount,
}: FollowListsServerProps) {
  // Fetch network preview data on the server
  const networkResult = await fetchNetworkPreviewServer(documentId, 3)

  if ("error" in networkResult) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{networkResult.message}</AlertDescription>
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
          {/* Interactive follow buttons - moved to client component */}
          <FollowListsInteractive
            username={username}
            documentId={documentId}
            isOwnProfile={isOwnProfile}
            followersCount={followersCount}
            followingCount={followingCount}
            networkData={networkResult}
          />
        </div>
      </div>

      {/* Preview section - rendered on server */}
      <div className="p-6">
        <div className="text-sm text-gray-600 mb-4">Recent connections</div>
        <div className="grid grid-cols-2 gap-6">
          {/* Followers Preview */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-3">Followers</div>
            {networkResult.followers.users.length > 0 ? (
              <div className="space-y-2">
                {networkResult.followers.users.slice(0, 3).map((user) => (
                  <div key={`follower-preview-${user.documentId}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {user.profileImage?.url ? (
                        <img
                          src={user.profileImage.url}
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">
                          {user.username.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                    </div>
                    {user.isVerified && (
                      <div className="text-blue-500">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 py-4">No followers yet</div>
            )}
          </div>

          {/* Following Preview */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-3">Following</div>
            {networkResult.following.users.length > 0 ? (
              <div className="space-y-2">
                {networkResult.following.users.slice(0, 3).map((user) => (
                  <div key={`following-preview-${user.documentId}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {user.profileImage?.url ? (
                        <img
                          src={user.profileImage.url}
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">
                          {user.username.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                    </div>
                    {user.isVerified && (
                      <div className="text-blue-500">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 py-4">Not following anyone yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
