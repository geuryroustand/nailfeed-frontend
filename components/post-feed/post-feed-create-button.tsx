"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { motion } from "framer-motion"

interface PostFeedCreateButtonProps {
  onClick: () => void
  disabled?: boolean
}

export default function PostFeedCreateButton({ onClick, disabled }: PostFeedCreateButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      <Button
        onClick={onClick}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg h-12"
        disabled={disabled}
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        Create New Post
      </Button>
    </motion.div>
  )
}
