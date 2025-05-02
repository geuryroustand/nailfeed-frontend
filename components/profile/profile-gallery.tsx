import { Suspense } from "react"
import { ProfileGalleryClient } from "@/components/profile/profile-gallery-client"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchUserPosts, fetchUserCollections } from "@/lib/profile-data"

interface ProfileGalleryProps {
  username?: string
}

export default async function ProfileGallery({ username }: ProfileGalleryProps) {
  // Fetch data in parallel if we have a username
  let posts = null
  let collections = null

  if (username) {
    try {
      // Use Promise.all for parallel data fetching
      const [postsData, collectionsData] = await Promise.all([fetchUserPosts(username), fetchUserCollections(username)])

      posts = postsData
      collections = collectionsData

      // Pre-process data on the server if needed
      // For example, format dates, calculate statistics, etc.
      if (posts) {
        posts = posts.map((post) => ({
          ...post,
          // Format dates on the server
          formattedDate: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : undefined,
        }))
      }
    } catch (error) {
      console.error("Error fetching profile data:", error)
      // We'll let the client component handle the error state
    }
  }

  return (
    <Suspense fallback={<GallerySkeleton />}>
      <ProfileGalleryClient username={username} posts={posts} collections={collections} />
    </Suspense>
  )
}

function GallerySkeleton() {
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}
