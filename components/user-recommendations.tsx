"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { sampleUsers } from "@/lib/sample-data"
import { useAuth } from "@/context/auth-context"

export function UserRecommendations() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Check if we should use sample data
    const useSample = process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === "true"

    if (useSample) {
      // Use sample data
      setUsers(sampleUsers)
      setLoading(false)
      return
    }

    // Otherwise fetch from API
    const fetchUsers = async () => {
      try {
        setLoading(true)

        // Get the API URL from environment variables
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

        // Fetch recommended users from the API
        const response = await fetch(`${API_URL}/api/users/recommended`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch recommended users: ${response.status}`)
        }

        const data = await response.json()

        // Check if we have users
        if (data && data.data && Array.isArray(data.data)) {
          setUsers(data.data)
        } else {
          // If no users or invalid response, use sample data as fallback
          setUsers(sampleUsers)
        }
      } catch (error) {
        console.error("Error fetching recommended users:", error)
        // Use sample data as fallback
        setUsers(sampleUsers)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center mb-4">
          <Users className="h-5 w-5 text-pink-500 mr-2" />
          <h2 className="text-lg font-semibold">Suggested for You</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
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
          <Users className="h-5 w-5 text-pink-500 mr-2" />
          <h2 className="text-lg font-semibold">Suggested for You</h2>
        </div>
        <Link href="/explore" className="text-sm text-pink-600 hover:underline">
          See all
        </Link>
      </div>

      <div className="space-y-4">
        {users.slice(0, 3).map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <Link href={`/profile/${user.username}`} className="flex items-center gap-3 group">
              <Avatar>
                <AvatarImage src={user.profileImage?.url || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium group-hover:text-pink-600 transition-colors">
                  {user.displayName || user.username}
                </p>
                <p className="text-xs text-gray-500">{user.followers.toLocaleString()} followers</p>
              </div>
            </Link>

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
              onClick={(e) => {
                e.preventDefault()
                if (!isAuthenticated) {
                  window.location.href = "/auth"
                }
              }}
            >
              Follow
            </Button>
          </div>
        ))}
      </div>

      {!isAuthenticated && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Sign in to follow creators and see more content</p>
          <Button className="w-full bg-pink-600 hover:bg-pink-700" asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
