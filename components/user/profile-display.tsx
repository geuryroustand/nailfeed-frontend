"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import type { User } from "@/lib/services/auth-service"
import { getCurrentUser } from "@/lib/services/auth-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileDisplay() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (err) {
        console.error("Error fetching user profile:", err)
        setError("Failed to load user profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>There was a problem loading your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Profile Found</CardTitle>
          <CardDescription>Please log in to view your profile</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          {user.profileImage ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full">
              <Image
                src={user.profileImage.url || "/placeholder.svg"}
                alt={user.username}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-600">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium">{user.displayName || user.username}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {user.bio && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Bio</h4>
            <p className="mt-1">{user.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-2xl font-bold">{user.postsCount || 0}</p>
            <p className="text-sm text-gray-500">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{user.followersCount || 0}</p>
            <p className="text-sm text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{user.followingCount || 0}</p>
            <p className="text-sm text-gray-500">Following</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
