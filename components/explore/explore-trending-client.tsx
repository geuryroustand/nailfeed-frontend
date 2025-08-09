"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

interface TrendingTag {
  id: number
  name: string
  posts: string
  image: string
}

interface ExploreTrendingClientProps {
  trendingTags: TrendingTag[]
}

export default function ExploreTrendingClient({ trendingTags }: ExploreTrendingClientProps) {
  const router = useRouter()

  const handleTagClick = (tagName: string) => {
    router.push(`/explore?q=${encodeURIComponent(tagName)}`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trendingTags.map((tag, index) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative rounded-lg overflow-hidden aspect-square cursor-pointer"
            onClick={() => handleTagClick(tag.name)}
          >
            <img
              src={tag.image || "/placeholder.svg"}
              alt={tag.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-3 text-white">
                <p className="font-medium text-sm">#{tag.name}</p>
                <p className="text-xs opacity-80">{tag.posts} posts</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
