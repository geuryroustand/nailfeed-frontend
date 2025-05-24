import { Suspense } from "react"
import { ProfileGalleryClient } from "./profile-gallery-client"
import { processPostsForGallery } from "@/lib/post-data-processors"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileGalleryServerProps {
  user: UserProfileResponse
}

export async function ProfileGalleryServer({ user }: ProfileGalleryServerProps) {
  // Process posts on server side for better performance
  const posts = user.posts || []
  const processedPosts = processPostsForGallery(posts)

  return (
    <div className="border-t border-gray-100">
      <Suspense fallback={<ProfileGalleryServerSkeleton />}>
        <div className="p-4 md:p-6">
          <ProfileGalleryClient posts={processedPosts} username={user.username} />
        </div>
      </Suspense>
    </div>
  )
}

function ProfileGalleryServerSkeleton() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-16 bg-gray-200 rounded" />
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
