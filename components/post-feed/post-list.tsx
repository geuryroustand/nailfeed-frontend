"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ReactionProvider } from "@/context/reaction-context"
import Post from "@/components/post"
import type { Post as PostType } from "@/lib/post-data"

interface PostListProps {
  posts: PostType[]
  viewMode: "cards" | "compact"
  onPostDeleted: (postId: number) => void
  onPostUpdated: (updatedPost: PostType) => void
}

export default function PostList({ posts, viewMode, onPostDeleted, onPostUpdated }: PostListProps) {
  return (
    <div className="divide-y divide-gray-100">
      <AnimatePresence>
        <ReactionProvider>
          {posts.map((post, index) => (
            <motion.div
              key={`${post.id}-${index}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.1, 0.5) }}
              exit={{ opacity: 0, y: -50 }}
            >
              <Post post={post} viewMode={viewMode} onPostDeleted={onPostDeleted} onPostUpdated={onPostUpdated} />
            </motion.div>
          ))}
        </ReactionProvider>
      </AnimatePresence>
    </div>
  )
}
