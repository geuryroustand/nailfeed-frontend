"use client"

import { useState, useEffect } from "react"
import { StoryBar } from "@/components/story-bar"
import { sampleStories } from "@/lib/sample-data"

export function FeaturedStories() {
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we should use sample data
    const useSample = process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === "true"

    if (useSample) {
      // Use sample data
      setStories(sampleStories)
      setLoading(false)
      return
    }

    // Otherwise fetch from API
    const fetchStories = async () => {
      try {
        setLoading(true)

        // Get the API URL from environment variables
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

        // Fetch stories from the API
        const response = await fetch(`${API_URL}/api/stories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch stories: ${response.status}`)
        }

        const data = await response.json()

        // Check if we have stories
        if (data && data.data && Array.isArray(data.data)) {
          setStories(data.data)
        } else {
          // If no stories or invalid response, use sample data as fallback
          setStories(sampleStories)
        }
      } catch (error) {
        console.error("Error fetching stories:", error)
        // Use sample data as fallback
        setStories(sampleStories)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  if (loading) {
    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-20">
              <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse ring-2 ring-gray-200 mb-2" />
              <div className="h-3 w-16 mx-auto bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <StoryBar stories={stories} />
}
