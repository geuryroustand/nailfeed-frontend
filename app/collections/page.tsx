import { Suspense } from "react"
import CollectionsClient from "@/components/collections/collections-client"
import CollectionsSkeleton from "@/components/collections/collections-skeleton"
import { getCollections } from "@/lib/collections-data"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CollectionsPage() {
  // Fetch collections on the server
  const collections = await getCollections()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Collections</h1>

      <Suspense fallback={<CollectionsSkeleton />}>
        <CollectionsClient initialCollections={collections} />
      </Suspense>
    </div>
  )
}
