import type { Post } from "@/lib/post-data"

interface StructuredDataProps {
  post: Post
  url: string
}

export default function StructuredData({ post, url }: StructuredDataProps) {
  // Get the post image URL
  const imageUrl = post.image || (post.mediaItems && post.mediaItems.length > 0 ? post.mediaItems[0].url : null)

  // Create the structured data object
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title || `${post.username}'s nail art post`,
    image: imageUrl ? [imageUrl] : [],
    datePublished: post.timestamp,
    dateModified: post.timestamp,
    author: {
      "@type": "Person",
      name: post.username,
    },
    publisher: {
      "@type": "Organization",
      name: "NailFeed",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/logo.png`,
      },
    },
    description: post.description || `Nail art post by ${post.username}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: post.tags?.join(", ") || "nail art",
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}
