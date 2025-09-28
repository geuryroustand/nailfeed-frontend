import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicCollectionWithPostsAction } from "@/lib/actions/collections-actions"
import type { Post } from "@/lib/post-data"

interface CollectionDetailPageProps {
  params: {
    id: string
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PublicCollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = params
  let collection = null
  try {
    collection = await getPublicCollectionWithPostsAction(id)
  } catch (error) {
    console.error("Unable to load public collection:", error)
    collection = null
  }

  if (!collection) {
    notFound()
  }

  const posts: Post[] = Array.isArray(collection.posts) ? collection.posts : []
  const ownerName = collection.owner?.username || collection.owner?.displayName
  const designsLabel = `${collection.postIds.length} ${collection.postIds.length === 1 ? "design" : "designs"}`

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {collection.coverImage ? (
              <div className="relative h-64 w-full">
                <Image
                  src={collection.coverImage}
                  alt={collection.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center bg-gray-100 text-gray-400">
                <span>No cover image</span>
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
              {collection.description && (
                <p className="mt-3 text-base text-gray-600">{collection.description}</p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-pink-600">
                  {designsLabel}
                </span>
                {ownerName && (
                  <span>
                    Curated by <span className="font-medium text-gray-700">{ownerName}</span>
                  </span>
                )}
                <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <aside className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Save this collection</h2>
          <p className="text-sm text-gray-600">
            Like what you see? Sign in to copy this collection into your personal library and start curating your own nail inspiration.
          </p>
          <Link
            href="/auth"
            className="inline-flex w-full items-center justify-center rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
          >
            Sign in to save
          </Link>
        </aside>
      </div>

      <section aria-labelledby="collection-designs-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="collection-designs-heading" className="text-xl font-semibold text-gray-900">
            Designs in this collection
          </h2>
          {posts.length > 0 && (
            <p className="text-sm text-gray-500">{designsLabel} curated for you</p>
          )}
        </div>
        {posts.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-gray-200 py-16 text-center text-gray-500">
            This collection does not have any public posts yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {posts.map((post) => {
              const postLabel = post.description?.trim() || post.title?.trim() || "Untitled design"
              const authorLabel = post.username?.trim() || post.user?.username?.trim() || "unknown"
              return (
                <Link
                  key={post.documentId || post.id}
                  href={post.documentId ? `/post/${post.documentId}` : `/post/${post.id}`}
                  aria-label={`View design ${postLabel}`}
                  className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_20px_45px_-25px_rgba(15,23,42,0.4)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-28px_rgba(236,72,153,0.45)]">
                    <PostThumbnail post={post} altText={postLabel} />
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <p className="text-base font-semibold text-gray-900 transition-colors group-hover:text-pink-600 line-clamp-2">
                        {postLabel}
                      </p>
                      <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
                        <span className="font-medium">@{authorLabel}</span>
                        {typeof post.likesCount === "number" && post.likesCount > 0 && (
                          <span
                            aria-label={`${post.likesCount} likes`}
                            className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600"
                          >
                            <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                            </svg>
                            {post.likesCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function PostThumbnail({ post, altText }: { post: Post; altText: string }) {
  const mediaUrl = post.mediaItems?.[0]?.url || post.media?.[0]?.url || post.image

  if (!mediaUrl) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-dashed border-gray-200 bg-gray-50">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
          <span aria-hidden="true" className="text-lg font-semibold text-gray-400">
            NF
          </span>
          <span>No image available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-pink-50 via-white to-purple-100">
      <Image
        src={mediaUrl}
        alt={altText}
        fill
        className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 24vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
        priority={false}
      />
    </div>
  )
}
