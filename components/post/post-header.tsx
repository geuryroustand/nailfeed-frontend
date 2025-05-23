import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Post } from "@/lib/post-data"

interface PostHeaderProps {
  post: Post
}

export default function PostHeader({ post }: PostHeaderProps) {
  return (
    <>
      {/* Back navigation */}
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to feed</span>
        </Link>
      </div>

      {/* Post header */}
      <div className="p-4 sm:p-6 border-b bg-white rounded-t-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href={`/profile/${post.username}`} aria-label={`View ${post.username}'s profile`}>
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 transition-transform hover:scale-105">
                <AvatarImage
                  src={post.userImage || "/placeholder.svg"}
                  alt={post.username}
                  width={56}
                  height={56}
                  loading="eager"
                  sizes="(max-width: 640px) 48px, 56px"
                />
                <AvatarFallback>{post.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="ml-3">
              <Link
                href={`/profile/${post.username}`}
                className="text-base sm:text-lg font-medium hover:text-pink-600 transition-colors"
              >
                {post.username}
              </Link>
              <p className="text-sm text-gray-500">{post.timestamp}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
