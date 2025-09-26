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

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Designs in this collection</h2>
        {posts.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-gray-200 py-16 text-center text-gray-500">
            This collection does not have any public posts yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.documentId || post.id}
                href={post.documentId ? `/post/${post.documentId}` : `/post/${post.id}`}
                className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
              >
                <PostThumbnail post={post} />
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2">
                    {post.description || post.title || "Untitled design"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>@{post.username || post.user?.username || "unknown"}</span>
                    {typeof post.likesCount === "number" && post.likesCount > 0 && (
                      <span>{post.likesCount} likes</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function PostThumbnail({ post }: { post: Post }) {
  const mediaUrl = post.mediaItems?.[0]?.url || post.media?.[0]?.url || post.image

  if (!mediaUrl) {
    return (
      <div className="flex h-48 items-center justify-center bg-gray-100 text-gray-400">
        <span>No image</span>
      </div>
    )
  }

  return (
    <div className="relative h-48 w-full overflow-hidden bg-gray-100">
      <Image
        src={mediaUrl}
        alt="Post preview"
        fill
        className="object-cover transition duration-300 group-hover:scale-105"
        sizes="(min-width: 768px) 33vw, 100vw"
        priority={false}
      />
    </div>
  )
}
