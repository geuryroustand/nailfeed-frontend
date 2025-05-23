"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface ImageComparisonTestProps {
  post: any
}

export function ImageComparisonTest({ post }: ImageComparisonTestProps) {
  const [showComparison, setShowComparison] = useState(true)

  // Extract URLs using different methods
  const relatedPostsUrl = post.image || (post.mediaItems && post.mediaItems[0]?.url) || "/intricate-nail-art.png"

  // Get direct URL from mediaItems if available
  const getDirectUrl = () => {
    if (!post.mediaItems || !post.mediaItems[0]) return null

    const item = post.mediaItems[0]

    // Try to get URL from formats
    if (item.file?.formats?.medium?.url) {
      return `https://nailfeed-backend-production.up.railway.app${item.file.formats.medium.url}`
    }

    // Try direct URL property
    if (item.url) {
      return item.url
    }

    return null
  }

  const directUrl = getDirectUrl()

  // Log URLs for comparison
  useEffect(() => {
    console.log("Image Comparison Test:")
    console.log("Related Posts URL:", relatedPostsUrl)
    console.log("Direct URL:", directUrl)

    // Test loading both images
    if (relatedPostsUrl) {
      const img1 = new Image()
      img1.onload = () => console.log("Related Posts URL loaded successfully")
      img1.onerror = () => console.error("Related Posts URL failed to load")
      img1.src = relatedPostsUrl
    }

    if (directUrl) {
      const img2 = new Image()
      img2.onload = () => console.log("Direct URL loaded successfully")
      img2.onerror = () => console.error("Direct URL failed to load")
      img2.src = directUrl
    }
  }, [relatedPostsUrl, directUrl])

  if (!showComparison) return null

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Image Rendering Comparison</h3>
        <button onClick={() => setShowComparison(false)} className="text-sm text-gray-500 hover:text-gray-700">
          Hide
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Related Posts Method:</p>
          <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-200">
            <img
              src={relatedPostsUrl || "/placeholder.svg"}
              alt="Related Posts Method"
              className="object-cover w-full h-full"
            />
          </div>
          <p className="text-xs break-all">{relatedPostsUrl}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Direct URL Method:</p>
          <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-200">
            {directUrl ? (
              <img
                src={directUrl || "/placeholder.svg"}
                alt="Direct URL Method"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No direct URL available
              </div>
            )}
          </div>
          <p className="text-xs break-all">{directUrl || "N/A"}</p>
        </div>
      </div>

      <div className="mt-4 text-sm">
        <p>If one image displays correctly and the other doesn't, the URL construction method is the issue.</p>
      </div>
    </div>
  )
}
