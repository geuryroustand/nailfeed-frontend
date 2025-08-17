import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata, ResolvingMetadata } from "next"
import { getPostWithRelated } from "@/lib/actions/post-detail-actions"
import PostDetailServerOptimized from "@/components/post-detail-server-optimized"
import PostDetailSkeleton from "@/components/post-detail-skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PostPageProps {
  params: {
    id: string
  }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PostPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  try {
    // Fetch post data for metadata
    const { post } = await getPostWithRelated(params.id)

    // If post not found, return basic metadata
    if (!post) {
      return {
        title: "Post not found",
        description: "The requested post could not be found.",
      }
    }

    // Get parent metadata
    const previousImages = (await parent).openGraph?.images || []

    // Prepare post image for metadata
    const postImage = post.image || (post.mediaItems && post.mediaItems.length > 0 ? post.mediaItems[0].url : null)

    // Create description from post content
    const description = post.description
      ? post.description.length > 160
        ? `${post.description.substring(0, 157)}...`
        : post.description
      : `Nail art post by ${post.username}`

    return {
      title: `${post.title || `${post.username}'s post`} | NailFeed`,
      description,
      openGraph: {
        title: post.title || `${post.username}'s nail art post`,
        description,
        images: postImage ? [postImage, ...previousImages] : previousImages,
        type: "article",
        authors: [post.username],
        publishedTime: post.timestamp,
        tags: post.tags,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title || `${post.username}'s nail art post`,
        description,
        images: postImage ? [postImage] : [],
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Post | NailFeed",
      description: "View this nail art post",
    }
  }
}

// Generate static params for popular posts (ISR)
export async function generateStaticParams() {
  try {
    // Instead, return empty array to let Next.js handle dynamic generation
    return []
  } catch (error) {
    console.error("Error generating static params:", error)
    return []
  }
}

// Configure ISR with on-demand revalidation
export const dynamic = "force-dynamic" // Force dynamic rendering for now
export const revalidate = 3600 // Revalidate every hour

export default async function PostPage({ params }: PostPageProps) {
  try {
    const idOrDocumentId = params.id

    // Use the optimized server action to fetch both post and related posts
    const { post, relatedPosts } = await getPostWithRelated(idOrDocumentId)

    if (!post) {
      return notFound()
    }

    // Ensure the post has a documentId for comment functionality
    const postWithDocumentId = {
      ...post,
      documentId: post.documentId || idOrDocumentId,
    }

    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Suspense fallback={<PostDetailSkeleton />}>
          <PostDetailServerOptimized post={postWithDocumentId} relatedPosts={relatedPosts} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Error rendering post page:", error)

    // Return an error UI instead of notFound()
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            We encountered an error loading this post. Please try again later or return to the home page.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center mt-8">
          <a href="/" className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    )
  }
}
