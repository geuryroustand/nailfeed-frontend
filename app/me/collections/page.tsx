import { Suspense } from "react"
import CollectionsClient from "@/components/collections/collections-client"
import CollectionsSkeleton from "@/components/collections/collections-skeleton"
import { getUserCollectionsAction } from "@/lib/actions/collections-actions"
import { verifySession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MeCollectionsPage() {
  const session = await verifySession()
  if (!session) {
    redirect("/auth")
  }

  try {
    const collections = await getUserCollectionsAction()

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h1 className="text-2xl font-bold">My Collections</h1>
        </div>

        <Suspense fallback={<CollectionsSkeleton />}>
          <CollectionsClient initialCollections={collections} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Failed to load collections:", error)
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Collections</h1>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Unable to load your collections
          </h3>
          <p className="text-gray-600">
            Please try refreshing the page or check your connection.
          </p>
        </div>
      </div>
    )
  }
}
