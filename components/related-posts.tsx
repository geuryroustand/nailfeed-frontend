"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Post } from "@/lib/post-data"

interface RelatedPostsProps {
  posts: Post[]
  className?: string
}

export function RelatedPosts({ posts, className }: RelatedPostsProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollAmount = 320 // Approximate width of a card + margin

  const scrollLeft = () => {
    const newPosition = Math.max(0, scrollPosition - scrollAmount)
    setScrollPosition(newPosition)
    document.getElementById("related-posts-container")?.scrollTo({
      left: newPosition,
      behavior: "smooth",
    })
  }

  const scrollRight = () => {
    const container = document.getElementById("related-posts-container")
    if (!container) return

    const maxScroll = container.scrollWidth - container.clientWidth
    const newPosition = Math.min(maxScroll, scrollPosition + scrollAmount)
    setScrollPosition(newPosition)
    container.scrollTo({
      left: newPosition,
      behavior: "smooth",
    })
  }

  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <div className={cn("bg-white rounded-xl shadow-sm overflow-hidden", className)}>
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">Related Posts</h3>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div id="related-posts-container" className="flex overflow-x-auto scrollbar-hide p-4 gap-4 snap-x">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.documentId || post.id}`}
            className="flex-shrink-0 w-[280px] snap-start group"
          >
            <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square relative">
              <Image
                src={post.image || (post.mediaItems && post.mediaItems[0]?.url) || "/intricate-nail-art.png"}
                alt={post.description || "Post image"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="mt-2">
              <p className="font-medium text-sm line-clamp-2 group-hover:text-pink-500 transition-colors">
                {post.description || "No description"}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden mr-2">
                  <Image
                    src={post.userImage || "/placeholder.svg"}
                    alt={post.username}
                    width={20}
                    height={20}
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-gray-500">@{post.username}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
