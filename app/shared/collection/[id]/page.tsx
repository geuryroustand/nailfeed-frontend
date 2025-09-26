import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getSharedCollectionAction } from '@/lib/actions/collections-actions'
import SharedCollectionClient from '@/components/collections/shared-collection-client'
import CollectionsSkeleton from '@/components/collections/collections-skeleton'

interface SharedCollectionPageProps {
  params: {
    id: string
  }
  searchParams: {
    token?: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SharedCollectionPage({
  params,
  searchParams,
}: SharedCollectionPageProps) {
  const { id } = params
  const { token } = searchParams

  if (!token) {
    notFound()
  }

  try {
    const collection = await getSharedCollectionAction(id, token)

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{collection.name}</h1>
          {collection.description && (
            <p className="text-gray-600">{collection.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <span>Shared collection</span>
            <span>•</span>
            <span>{collection.postIds.length} posts</span>
          </div>
        </div>

        <Suspense fallback={<CollectionsSkeleton />}>
          <SharedCollectionClient collection={collection} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Failed to load shared collection:', error)
    notFound()
  }
}
