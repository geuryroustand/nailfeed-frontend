"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import CreatePostModal from "@/components/create-post-modal"
import { motion } from "framer-motion"

interface CreatePostButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
}

export default function CreatePostButton({
  className = "",
  variant = "default",
  size = "default",
  showLabel = true,
}: CreatePostButtonProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handlePostCreated = (newPost: any) => {
    // Close modal and rely on optimistic UI where available.
    // Profile gallery can be refreshed manually or updated via future state hookup.
    setShowCreateModal(false)
  }

  return (
    <>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant={variant}
          size={size}
          className={`${className} ${
            variant === "default" ? "bg-pink-500 hover:bg-pink-600" : ""
          } rounded-full shadow-md hover:shadow-lg transition-all`}
        >
          <Plus className="h-4 w-4 mr-1" />
          {showLabel && "Create Post"}
        </Button>
      </motion.div>

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onPostCreated={handlePostCreated} />
      )}
    </>
  )
}
