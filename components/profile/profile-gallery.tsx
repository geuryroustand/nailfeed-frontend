import { ProfileGalleryClient } from "./profile-gallery-client"
import type { UserProfileResponse } from "@/lib/services/user-service"
import { processPostsForGallery } from "@/lib/post-data-processors"

interface ProfileGalleryProps {
  user: UserProfileResponse
}

export default function ProfileGallery({ user }: ProfileGalleryProps) {
  // Ensure we have posts data
  const posts = user.posts || []

  // Process posts data on the server to optimize client-side rendering
  const processedPosts = processPostsForGallery(posts)

  return (
    <div className="p-4 md:p-6">
      <ProfileGalleryClient posts={processedPosts} username={user.username} />
    </div>
  )
}
