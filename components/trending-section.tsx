"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { sampleTrending } from "@/lib/sample-data"

export function TrendingSection() {
  const [trending, setTrending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we should use sample data
    const useSample = process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === "true"

    if (useSample) {
      // Use sample data
      setTrending(sampleTrending)
      setLoading(false)
      return
    }

    // Otherwise fetch from API
    const fetchTrending = async () => {
      try {
        setLoading(true)

        // Get the API URL from environment variables
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

        // Fetch trending tags from the API
        const response = await fetch(`${API_URL}/api/trending-tags`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch trending tags: ${response.status}`)
        }

        const data = await response.json()

        // Check if we have trending tags
        if (data && data.data && Array.isArray(data.data)) {
          setTrending(data.data)
        } else {
          // If no trending tags or invalid response, use sample data as fallback
          setTrending(sampleTrending)
        }
      } catch (error) {
        console.error("Error fetching trending tags:", error)
        // Use sample data as fallback
        setTrending(sampleTrending)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-pink-500 mr-2" />
          <h2 className="text-lg font-semibold">Trending</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-md animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-pink-500 mr-2" />
          <h2 className="text-lg font-semibold">Trending</h2>
        </div>
        <Link href="/explore" className="text-sm text-pink-600 hover:underline">
          See all
        </Link>
      </div>

      <div className="space-y-3">
        {trending.slice(0, 5).map((tag) => (
          <Link key={tag.id} href={`/explore?tag=${tag.tag}`} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
              <img src={tag.image || "/placeholder.svg"} alt={`#${tag.tag}`} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-medium group-hover:text-pink-600 transition-colors">#{tag.tag}</p>
              <p className="text-xs text-gray-500">{tag.count.toLocaleString()} posts</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
