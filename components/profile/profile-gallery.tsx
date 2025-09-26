import { ProfileGalleryInfinite } from "./profile-gallery-infinite"
import type { UserProfileResponse } from "@/lib/services/user-service"

interface ProfileGalleryProps {
  user: UserProfileResponse & { documentId: string }
}

export default function ProfileGallery({ user }: ProfileGalleryProps) {
  console.log(`[ProfileGallery] Setting up infinite scrolling for ${user.username} (${user.documentId})`);

  return (
    <div className="p-4 md:p-6">
      <ProfileGalleryInfinite
        documentId={user.documentId}
        username={user.username}
        initialPostsCount={user.posts?.length || 0}
      />
    </div>
  )
}
