import Link from "next/link"
import { getPublicCollectionsAction } from "@/lib/actions/collections-actions"
import { verifySession } from "@/lib/auth/session"
import PublicCollectionsGallery from "@/components/collections/public-collections-gallery"
import type { Collection } from "@/types/collection"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PublicCollectionsPage() {
  const sessionPromise = verifySession()
  let collections: Collection[] = []
  let loadError: Error | null = null

  try {
    collections = await getPublicCollectionsAction()
  } catch (error) {
    console.error("Unable to load public collections:", error)
    loadError = error instanceof Error ? error : new Error("Failed to load public collections")
  }

  const session = await sessionPromise
  const createHref = session ? "/me/collections" : "/auth"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Collections</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Discover curated nail inspiration from the Nailfeed community. Only public collections are displayed here.
          </p>
        </div>
        <Link
          href={createHref}
          className="inline-flex items-center justify-center rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
        >
          Create Collection
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-dashed border-red-200 bg-red-50 py-16 text-center">
          <h2 className="text-xl font-semibold text-red-700">We had trouble loading collections</h2>
          <p className="mt-2 text-sm text-red-600">Please refresh the page or try again later.</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-16 text-center">
          <h2 className="text-xl font-semibold text-gray-900">No public collections yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            Check back soon or create your own once you sign in.
          </p>
        </div>
      ) : (
        <PublicCollectionsGallery collections={collections} />
      )}
    </div>
  )
}
