"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Info } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function GuestModeBanner() {
  const { isAuthenticated } = useAuth()

  // If user is authenticated, don't show the banner
  if (isAuthenticated) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6 flex items-center justify-between"
    >
      <div className="flex items-center">
        <Info className="h-5 w-5 text-pink-500 mr-2 flex-shrink-0" />
        <p className="text-sm text-pink-700">
          You're viewing this profile in guest mode. Sign up or log in to follow, like, and comment.
        </p>
      </div>
      <div className="flex-shrink-0 ml-4">
        <Link href="/auth">
          <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white">
            Log in
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
