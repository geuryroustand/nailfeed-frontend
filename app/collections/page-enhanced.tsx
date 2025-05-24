import { Suspense } from "react"
import type { Metadata } from "next"
import CollectionsLayout from "@/components/collections/collections-layout"
import CollectionsHeader from "@/components/collections/collections-header-server"
import CollectionsGrid from "@/components/collections/collections-grid-server"
import CollectionsSkeleton from "@/components/collections/collections-skeleton-enhanced"
import { getCollectionsWithMetadata } from "@/lib/actions/collections-server-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const { collections } = await getCollectionsWithMetadata()

  return {
    title: `Your Collections (${collections.length})`,
    description: `Manage your ${collections.length} nail art collections and discover new designs`,
    openGraph: {
      title: `Your Collections (${collections.length})`,
      description: `Manage your ${collections.length} nail art collections`,
      type: "website",
    },
  }
}

export default async function CollectionsPageEnhanced() {
  return (
    <CollectionsLayout>
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />}>
          <CollectionsHeader />
        </Suspense>

        <Suspense fallback={<CollectionsSkeleton />}>
          <CollectionsGrid />
        </Suspense>
      </div>
    </CollectionsLayout>
  )
}
