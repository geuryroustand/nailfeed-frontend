"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function ExploreTrending() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Trending Now</h2>
        <Link href="#" className="text-sm text-pink-500 font-medium">
          See All
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trendingTags.map((tag, index) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative rounded-lg overflow-hidden aspect-square"
          >
            <img
              src={tag.image || "/placeholder.svg"}
              alt={tag.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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

const trendingTags = [
  {
    id: 1,
    name: "frenchtwist",
    posts: "24.5K",
    image: "/glitter-french-elegance.png",
  },
  {
    id: 2,
    name: "geometricnails",
    posts: "18.2K",
    image: "/geometric-harmony.png",
  },
  {
    id: 3,
    name: "floralnailart",
    posts: "32.1K",
    image: "/vibrant-floral-nails.png",
  },
  {
    id: 4,
    name: "abstractdesign",
    posts: "15.7K",
    image: "/abstract-pastel-swirls.png",
  },
]
