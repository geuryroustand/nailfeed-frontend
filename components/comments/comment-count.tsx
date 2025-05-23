"use client"

import { useState, useEffect } from "react"
import { CommentsService } from "@/lib/services/comments-service"
import { MessageCircle } from "lucide-react"

interface CommentCountProps {
  postId: string | number
  documentId?: string
  className?: string
  showIcon?: boolean
}

export default function CommentCount({ postId, documentId, className = "", showIcon = true }: CommentCountProps) {
  const [count, setCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        setIsLoading(true)
        // Get just the first page to get the total count
        const response = await CommentsService.getComments(postId, documentId, 1, 1)
        const totalCount = CommentsService.countTotalComments(response.data)
        setCount(totalCount)
      } catch (error) {
        console.error("Error fetching comment count:", error)
        setCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommentCount()
  }, [postId, documentId])

  if (isLoading) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        {showIcon && <MessageCircle className="h-4 w-4 mr-1 opacity-70" />}
        <span className="animate-pulse bg-gray-200 h-4 w-6 rounded"></span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      {showIcon && <MessageCircle className="h-4 w-4 mr-1" />}
      {count !== null ? count : 0}
    </span>
  )
}
