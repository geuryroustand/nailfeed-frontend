"use server"

import qs from "qs"
import { verifySession } from "@/lib/auth/session"

/**
 * Server-side network service for fetching followers/following data
 * Uses secure session instead of client-side auth proxy
 */

export interface NetworkUser {
  id: number
  documentId: string
  username: string
  displayName?: string
  profileImage?: {
    url: string
    alternativeText?: string
  }
  isVerified?: boolean
}

export interface NetworkData {
  followers: {
    users: NetworkUser[]
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
  following: {
    users: NetworkUser[]
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
}

// Process follow data into user format
function processFollowData(data: any[], type: 'followers' | 'following'): NetworkUser[] {
  return data.map((follow: any) => {
    const user = type === 'followers' ? follow.follower : follow.following
    if (!user) return null

    return {
      id: user.id,
      documentId: user.documentId,
      username: user.username,
      displayName: user.displayName || user.username,
      profileImage: user.profileImage ? {
        url: user.profileImage.url.startsWith("http")
          ? user.profileImage.url
          : `${process.env.NEXT_PUBLIC_API_URL || ""}${user.profileImage.url}`
      } : undefined,
      isVerified: user.isVerified || false,
    }
  }).filter(Boolean)
}

/**
 * Server-side fetch for network preview data
 */
export async function fetchNetworkPreviewServer(
  documentId: string,
  previewSize = 3
): Promise<NetworkData | { error: true; message: string }> {
  try {
    // Get authentication from secure session
    const session = await verifySession()
    const serverToken = process.env.API_TOKEN
    const token = session?.strapiJWT || serverToken

    if (!token) {
      throw new Error("No authentication token available")
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:1337"

    // Fetch both followers and following in parallel
    const [followersResponse, followingResponse] = await Promise.all([
      // Followers query
      fetch(`${apiUrl}/api/follows?${qs.stringify({
        filters: { following: { documentId: { $eq: documentId } } },
        populate: {
          follower: {
            populate: ['profileImage']
          }
        },
        pagination: { page: 1, pageSize: previewSize },
        sort: ["createdAt:desc"],
      })}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }),

      // Following query
      fetch(`${apiUrl}/api/follows?${qs.stringify({
        filters: { follower: { documentId: { $eq: documentId } } },
        populate: {
          following: {
            populate: ['profileImage']
          }
        },
        pagination: { page: 1, pageSize: previewSize },
        sort: ["createdAt:desc"],
      })}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })
    ])

    if (!followersResponse.ok || !followingResponse.ok) {
      throw new Error("Failed to fetch network data")
    }

    const followersData = await followersResponse.json()
    const followingData = await followingResponse.json()

    // Process the data
    const followersUsers = processFollowData(followersData.data || [], 'followers')
    const followingUsers = processFollowData(followingData.data || [], 'following')

    return {
      followers: {
        users: followersUsers,
        total: followersData.meta?.pagination?.total || followersUsers.length,
        page: followersData.meta?.pagination?.page || 1,
        pageSize: followersData.meta?.pagination?.pageSize || previewSize,
        pageCount: followersData.meta?.pagination?.pageCount || Math.ceil(followersUsers.length / previewSize),
      },
      following: {
        users: followingUsers,
        total: followingData.meta?.pagination?.total || followingUsers.length,
        page: followingData.meta?.pagination?.page || 1,
        pageSize: followingData.meta?.pagination?.pageSize || previewSize,
        pageCount: followingData.meta?.pagination?.pageCount || Math.ceil(followingUsers.length / previewSize),
      }
    }
  } catch (error) {
    console.error("Error fetching network preview server:", error)
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}