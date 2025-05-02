"use client"

import { motion } from "framer-motion"
import { Star, Users, Award } from "lucide-react"

export default function SocialProofBanner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-wrap justify-center gap-6 md:gap-10 py-4"
    >
      <div className="flex items-center">
        <Star className="h-5 w-5 text-yellow-400 mr-2" />
        <span className="text-sm text-gray-600">
          <span className="font-bold">4.9/5</span> average rating
        </span>
      </div>
      <div className="flex items-center">
        <Users className="h-5 w-5 text-pink-500 mr-2" />
        <span className="text-sm text-gray-600">
          <span className="font-bold">250K+</span> active users
        </span>
      </div>
      <div className="flex items-center">
        <Award className="h-5 w-5 text-purple-500 mr-2" />
        <span className="text-sm text-gray-600">
          <span className="font-bold">#1</span> nail art community
        </span>
      </div>
    </motion.div>
  )
}
