import Link from "next/link";
import { getPublicCollectionsAction } from "@/lib/actions/collections-actions";
import { verifySession } from "@/lib/auth/session";
import PublicCollectionsGallery from "@/components/collections/public-collections-gallery";
import type { Collection } from "@/types/collection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicCollectionsPage() {
  const sessionPromise = verifySession();
  let collections: Collection[] = [];
  let loadError: Error | null = null;

  try {
    collections = await getPublicCollectionsAction();
  } catch (error) {
    console.error("Unable to load public collections:", error);
    loadError =
      error instanceof Error
        ? error
        : new Error("Failed to load public collections");
  }

  const session = await sessionPromise;
  const createHref = session ? "/me/collections" : "/auth";
  const collectionCount = collections.length;
  const totalDesigns = collections.reduce(
    (sum, collection) => sum + (collection.postIds?.length || 0),
    0
  );
  const collectionLabel = `${collectionCount} ${
    collectionCount === 1 ? "collection" : "collections"
  }`;
  const designsLabel = `${totalDesigns} ${
    totalDesigns === 1 ? "design" : "designs"
  }`;

  return (
    <div className="bg-gradient-to-b from-rose-50/70 via-white to-white">
      <div className="container mx-auto px-4 pb-12 pt-10">
        <section
          aria-labelledby="public-collections-heading"
          className="relative overflow-hidden rounded-4xl border border-pink-100 bg-white/90 p-8 shadow-[0_25px_80px_-45px_rgba(190,24,93,0.65)] backdrop-blur-sm sm:p-12"
        >
          <div
            className="absolute inset-y-0 right-0 hidden w-1/2 translate-x-1/3 rounded-full bg-gradient-to-br from-pink-200/40 via-white/40 to-purple-200/40 blur-3xl md:block"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-5">
              <p className="inline-flex items-center gap-2 rounded-full bg-pink-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-700">
                Nailfeed Collections
              </p>
              <div className="space-y-4">
                <h1
                  id="public-collections-heading"
                  className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
                >
                  Discover nail art inspiration curated by the community.
                </h1>
                <p className="text-base text-gray-600 sm:text-lg">
                  From seasonal looks and holiday themes to creative mood boards
                  and color palettes, explore public collections designed to
                  spark your next manicure idea.
                </p>
              </div>
              <ul
                className="flex flex-wrap gap-3 text-sm"
                aria-label="Collection statistics"
              >
                <li
                  className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-gray-700 shadow-sm backdrop-blur"
                  aria-label={`${collectionLabel} available`}
                >
                  <span className="text-base font-semibold text-pink-600">
                    {collectionCount}
                  </span>
                  <span className="font-medium text-gray-600">
                    {collectionCount === 1
                      ? "Collection live"
                      : "Collections live"}
                  </span>
                </li>
                <li
                  className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-gray-700 shadow-sm backdrop-blur"
                  aria-label={`${designsLabel} featured`}
                >
                  <span className="text-base font-semibold text-pink-600">
                    {totalDesigns}
                  </span>
                  <span className="font-medium text-gray-600">
                    {totalDesigns === 1
                      ? "Design featured"
                      : "Designs featured"}
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-4 rounded-3xl border border-pink-100/70 bg-white/80 p-6 text-center shadow-inner backdrop-blur sm:max-w-xs">
              <p className="text-sm font-medium text-gray-900">
                Start your own story
              </p>
              <p className="text-sm text-gray-600">
                Save your favorite designs, remix seasonal styles, and build the
                perfect inspiration board.
              </p>
              <Link
                href={createHref}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-pink-400 to-purple-400 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
              >
                Create collection
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="gallery-heading" className="mt-12 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2
              id="gallery-heading"
              className="text-xl font-semibold text-gray-900 sm:text-2xl"
            >
              Browse community showcases
            </h2>
            {collectionCount > 0 && !loadError && (
              <p className="hidden text-sm text-gray-500 sm:block">
                Pick a collection to explore in detail
              </p>
            )}
          </div>
          {loadError ? (
            <div
              role="alert"
              className="rounded-3xl border border-red-100 bg-red-50/80 px-6 py-12 text-center text-red-700 shadow-sm"
            >
              <h3 className="text-lg font-semibold">
                We had trouble loading collections
              </h3>
              <p className="mt-2 text-sm text-red-600">
                Please refresh the page or try again later.
              </p>
            </div>
          ) : collectionCount === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white/60 px-6 py-16 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                No public collections yet
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Check back soon or create your own once you sign in.
              </p>
            </div>
          ) : (
            <PublicCollectionsGallery collections={collections} />
          )}
        </section>
      </div>
    </div>
  );
}
