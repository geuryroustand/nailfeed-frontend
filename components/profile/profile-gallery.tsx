import { Suspense } from "react"
import { ProfileGalleryClient } from "./profile-gallery-client"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileGalleryProps {
  user: UserProfileResponse
}

export default function ProfileGallery({ user }: ProfileGalleryProps) {
  // Ensure we have posts data
  const posts = user.posts || []
  const isOwnProfile = false // This will be determined by the client component

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading gallery...</div>}>
      <div className="p-4 md:p-6">
        <ProfileGalleryClient posts={posts} username={user.username} />
      </div>
    </Suspense>
  )
}
