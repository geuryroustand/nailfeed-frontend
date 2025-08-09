import qs from "qs"
import config from "@/lib/config"

/**
 * Optimized function to fetch profile data for unauthenticated users in a single request
 */
export async function getGuestProfileData(username: string) {
  try {
    console.log(`Fetching guest profile data for username: ${username}`)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"

    // Use the API token from config for public access
    const token = config.api.getApiToken()

    if (!token) {
      console.error("No API token available for guest profile access")
      return null
    }

    // Build a comprehensive query to get all needed data in one request
    const query = qs.stringify(
      {
        filters: {
          username: {
            $eq: username,
          },
        },
        populate: [
          "profileImage",
          "coverImage",
          "posts",
          "posts.mediaItems",
          "posts.mediaItems.file",
          "posts.user",
          "posts.user.profileImage",
          "followers",
          "followers.follower",
          "followers.follower.profileImage",
          "following",
          "following.following",
          "following.following.profileImage",
        ],
      },
      { encodeValuesOnly: true },
    )

    // Make a single request to get all profile data
    const response = await fetch(`${apiUrl}/api/users?${query}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Failed to fetch guest profile: ${response.status}`)
      return null
    }

    const data = await response.json()
    const userData = data.data?.[0] || data[0]

    if (!userData) {
      console.error(`No guest profile data found for username: ${username}`)
      return null
    }

    // Process followers data
    const followers = (userData.followers || [])
      .map((follow) => {
        const follower = follow.follower
        if (!follower) return null

        return {
          id: follower.id,
          documentId: follower.documentId,
          username: follower.username,
          displayName: follower.displayName || follower.username,
          profileImage: follower.profileImage,
          isFollowing: false, // Guest users can't follow anyone
        }
      })
      .filter(Boolean)

    // Process following data
    const following = (userData.following || [])
      .map((follow) => {
        const followingUser = follow.following
        if (!followingUser) return null

        return {
          id: followingUser.id,
          documentId: followingUser.documentId,
          username: followingUser.username,
          displayName: followingUser.displayName || followingUser.username,
          profileImage: followingUser.profileImage,
          isFollowing: true, // The user is following these accounts
        }
      })
      .filter(Boolean)

    // Process posts data to include media items
    const posts = (userData.posts || []).map((post) => {
      // Ensure we have the required media items
      const mediaItems = post.mediaItems || []

      return {
        ...post,
        mediaItems,
        username: userData.username,
        userImage: userData.profileImage?.url || "",
      }
    })

    // Return a complete profile with all the data
    return {
      username: userData.username,
      displayName: userData.displayName || userData.username,
      bio: userData.bio || "",
      website: userData.website || "",
      location: userData.location || "",
      avatar: userData.profileImage?.url || "",
      isVerified: userData.isVerified || false,
      isFollowing: false, // Guest users can't follow anyone
      stats: {
        posts: userData.postsCount || posts.length || 0,
        followers: userData.followersCount || followers.length || 0,
        following: userData.followingCount || following.length || 0,
      },
      engagement: {
        likes: 0,
        comments: 0,
        saves: 0,
      },
      profileImage: userData.profileImage,
      coverImage: userData.coverImage,
      posts: posts,
      followers: followers,
      following: following,
    }
  } catch (error) {
    console.error(`Error fetching guest profile for ${username}:`, error)
    return null
  }
}
