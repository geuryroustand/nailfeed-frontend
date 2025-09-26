"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, ImageIcon, Heart } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function AuthCTA() {
  const { isAuthenticated } = useAuth()

  // Don't render anything if the user is already logged in
  if (isAuthenticated) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden mb-6"
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Join the NailFeed Community</h2>
            <p className="text-gray-500">
              Sign up to share your nail art, get inspired, and connect with nail artists worldwide.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Log in
              </Button>
            </Link>
            <Link href="/auth?tab=signup">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center text-pink-500 mb-1">
              <Users className="h-5 w-5 mr-2" />
              <span className="text-xl font-bold">250K+</span>
            </div>
            <p className="text-xs text-gray-500 text-center md:text-left">Active members</p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center text-pink-500 mb-1">
              <ImageIcon className="h-5 w-5 mr-2" />
              <span className="text-xl font-bold">1.2M+</span>
            </div>
            <p className="text-xs text-gray-500 text-center md:text-left">Nail designs shared</p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center text-pink-500 mb-1">
              <Heart className="h-5 w-5 mr-2" />
              <span className="text-xl font-bold">5.7M+</span>
            </div>
            <p className="text-xs text-gray-500 text-center md:text-left">Monthly interactions</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
