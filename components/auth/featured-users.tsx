"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const featuredUsers = [
  {
    name: "Sophia Lee",
    username: "nailartist",
    avatar: "/vibrant-artist-portrait.png",
    followers: "24.8K",
  },
  {
    name: "Mia Johnson",
    username: "mianails",
    avatar: "/testimonials/aisha-patel.png",
    followers: "18.5K",
  },
  {
    name: "Alex Rivera",
    username: "nailking",
    avatar: "/testimonials/marcus-johnson.png",
    followers: "32.1K",
  },
  {
    name: "Emma Chen",
    username: "nailsbyemma",
    avatar: "/testimonials/sophia-chen.png",
    followers: "15.7K",
  },
]

export default function FeaturedUsers() {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Featured Creators on NailFeed</h3>
      <div className="grid grid-cols-2 gap-3">
        {featuredUsers.map((user, index) => (
          <motion.div
            key={user.username}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center bg-white p-2 rounded-lg"
          >
            <Avatar className="h-10 w-10 mr-3 border-2 border-pink-100">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <div className="flex items-center">
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                <span className="mx-1 text-gray-300">•</span>
                <p className="text-xs text-pink-500 font-medium">{user.followers} followers</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
