import { Suspense } from "react"
import { ProfileGalleryClient } from "./profile-gallery-client"
import type { UserProfileResponse } from "@/lib/services/user-service"
import { processPostsForGallery } from "@/lib/post-data-processors"

interface ProfileGalleryServerProps {
  user: UserProfileResponse
}

export async function ProfileGalleryServer({ user }: ProfileGalleryServerProps) {
  if (!user) {
    return <div className="p-4 text-center">Error loading profile data</div>
  }

  // Process posts data on the server to optimize client-side rendering
  const processedPosts = processPostsForGallery(user.posts || [])

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading gallery...</div>}>
      <div className="p-4 md:p-6">
        <ProfileGalleryClient posts={processedPosts} username={user.username} />
      </div>
    </Suspense>
  )
}
