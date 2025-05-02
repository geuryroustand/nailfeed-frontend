"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { useRef } from "react"

const stories = [
  { id: 1, username: "nailartist", image: "/vibrant-abstract-nails.png" },
  { id: 2, username: "glamnails", image: "/shimmering-gold-flakes.png" },
  { id: 3, username: "trendynails", image: "/abstract-pastel-swirls.png" },
  { id: 4, username: "nailpro", image: "/intricate-floral-nails.png" },
  { id: 5, username: "artsynails", image: "/vibrant-floral-nails.png" },
  { id: 6, username: "nailinspo", image: "/placeholder.svg?height=100&width=100&query=inspirational+nail+art" },
  { id: 7, username: "nailgoals", image: "/placeholder.svg?height=100&width=100&query=nail+goals+design" },
]

export default function StoryBar() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-6 bg-white p-4 rounded-lg border border-gray-100 md:border-gray-200"
    >
      <h2 className="text-sm font-medium text-gray-700 mb-3">Trending Designs</h2>
      <div ref={scrollRef} className="flex overflow-x-auto pb-2 scrollbar-hide">
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 mr-4 first:ml-0 last:mr-0"
          >
            <div className="flex flex-col items-center">
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500">
                <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white">
                  <AvatarImage src={story.image || "/placeholder.svg"} alt={story.username} />
                  <AvatarFallback>{story.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs mt-1 text-gray-700">{story.username}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
