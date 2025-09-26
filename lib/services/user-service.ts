import config from "@/lib/config"
import qs from "qs"

export type UserProfileResponse = {
  id: number
  documentId?: string
  username: string
  email: string
  displayName?: string
  bio?: string
  location?: string
  website?: string
  profileImage?: {
    id: number
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
  coverImage?: {
    id: number
    url: string
    formats?: {
      thumbnail?: { url: string }
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
    }
  }
  isVerified: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  engagement?: {
    likes: number
    comments: number
    saves: number
  }
  confirmed?: boolean
  posts?: Array<{
    id: number
    documentId: string
    description: string
    contentType: string
    galleryLayout: string
    publishedAt: string
    likesCount: number
    commentsCount: number
    mediaItems: Array<{
      id: number | string
      type: string
      order: number
      file: {
        url: string
        formats?: {
          thumbnail?: { url: string }
          small?: { url: string }
          medium?: { url: string }
          large?: { url: string }
        }
      }
    }>
  }>
}

export type UserUpdateInput = {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  profileImage?: number
  coverImage?: number
}

export type UserServiceError = {
  status: number
  message: string
}

// Get the API URL with fallback
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
}

// Helper function to safely make API requests with proper error handling
async function safeApiRequest(url: string, options: RequestInit) {
  try {
    console.log(`Making API request to: ${url}`)
    console.log(`Request headers:`, JSON.stringify(options.headers, null, 2))

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error (${response.status}): ${errorText}`)
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    return response
  } catch (error) {
    console.error(`Request failed for ${url}:`, error)
    throw error
  }
}

export class UserService {
  /**
   * Get the current user's profile with all necessary data
   */
  static async getCurrentUser(token: string): Promise<UserProfileResponse | null> {
    try {
      console.log(`Fetching user profile with token: ${token.substring(0, 10)}...`)

      // Build a comprehensive query using qs
      const query = qs.stringify(
        {
          fields: [
            "id",
            "documentId",
            "username",
            "email",
            "displayName",
            "bio",
            "location",
            "website",
            "followersCount",
            "followingCount",
            "postsCount",
            "engagement",
            "isVerified",
            "confirmed",
          ],
          populate: {
            profileImage: {
              fields: ["url", "formats"],
            },
            coverImage: {
              fields: ["url", "formats"],
            },
            posts: {
              sort: ["publishedAt:desc"],
              populate: {
                mediaItems: {
                  populate: {
                    file: {
                      fields: ["url", "formats"],
                    },
                  },
                  fields: ["id", "type", "order"],
                },
              },
              fields: [
                "id",
                "documentId",
                "description",
                "contentType",
                "galleryLayout",
                "publishedAt",
                "likesCount",
                "commentsCount",
              ],
            },
          },
        },
        {
          encodeValuesOnly: true,
        },
      )

      console.log(`Getting current user via auth-proxy`)

      // Use direct fetch with token for server-side call
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/users/me?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}): ${errorText}`)
        throw new Error(`API error (${response.status}): ${errorText}`)
      }

      const responseData = await response.json()
      console.log("Response data structure:", Object.keys(responseData))

      // Handle Strapi v5 response structure
      const userData = responseData.data || responseData

      // Process the data to ensure all URLs are absolute
      return UserService.processUserData(userData, apiUrl)
    } catch (error) {
      console.error("Error fetching current user:", error)
      return null
    }
  }

  /**
   * Get a user's profile by username with all necessary data
   */
  static async getUserByUsername(username: string, token?: string): Promise<UserProfileResponse | null> {
    try {
      console.log(`Fetching user ${username} from API`)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // If no token provided, use the API token from config (server-only; client receives null)
      const authToken = token || config.api.getApiToken()

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`
        console.log(`Using token for API request: ${authToken.substring(0, 10)}...`)
      } else {
        console.log("No token available for API request")
      }

      // Build a comprehensive query using qs
      const query = qs.stringify(
        {
          filters: {
            username: {
              $eq: username,
            },
          },
          fields: [
            "id",
            "documentId",
            "username",
            "email",
            "displayName",
            "bio",
            "location",
            "website",
            "followersCount",
            "followingCount",
            "postsCount",
            "engagement",
            "isVerified",
            "confirmed",
          ],
          populate: {
            profileImage: {
              fields: ["url", "formats"],
            },
            coverImage: {
              fields: ["url", "formats"],
            },
            posts: {
              sort: ["publishedAt:desc"],
              populate: {
                mediaItems: {
                  populate: {
                    file: {
                      fields: ["url", "formats"],
                    },
                  },
                  fields: ["id", "type", "order"],
                },
              },
              fields: [
                "id",
                "documentId",
                "description",
                "contentType",
                "galleryLayout",
                "publishedAt",
                "likesCount",
                "commentsCount",
              ],
            },
          },
        },
        {
          encodeValuesOnly: true,
        },
      )

      const apiUrl = getApiUrl()
      console.log(`Making request to: ${apiUrl}/api/users?${query}`)

      // Use cache: 'no-store' to ensure we get fresh data
      const response = await fetch(`${apiUrl}/api/users?${query}`, {
        method: "GET",
        headers,
        cache: "no-store",
      })

      console.log(`Response status for ${username}: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}): ${errorText}`)
        throw new Error(`API error (${response.status}): ${errorText}`)
      }

      const responseData = await response.json()
      console.log("Response data structure:", Object.keys(responseData))

      // Handle Strapi v5 response structure
      let userData = null

      if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
        userData = responseData.data[0]
      } else if (responseData.results && Array.isArray(responseData.results) && responseData.results.length > 0) {
        userData = responseData.results[0]
      } else if (Array.isArray(responseData) && responseData.length > 0) {
        userData = responseData[0]
      }

      if (!userData) {
        console.log(`No user found with username: ${username}`)
        return null
      }

      // Process the data to ensure all URLs are absolute
      return UserService.processUserData(userData, apiUrl)
    } catch (error) {
      console.error(`Error fetching user ${username}:`, error)
      return null
    }
  }

  /**
   * Get a user's profile by documentId with all necessary data
   */
  static async getUserByDocumentId(documentId: string, token?: string): Promise<UserProfileResponse | null> {
    try {
      console.log(`Fetching user by documentId: ${documentId}`)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // If no token provided, use the API token from config (server-only; client receives null)
      const authToken = token || config.api.getApiToken()

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`
        console.log(`Using token for API request: ${authToken.substring(0, 10)}...`)
      } else {
        console.log("No token available for API request")
      }

      // Build a comprehensive query using qs to filter by documentId
      const query = qs.stringify(
        {
          filters: {
            documentId: {
              $eq: documentId,
            },
          },
          fields: [
            "id",
            "documentId",
            "username",
            "email",
            "displayName",
            "bio",
            "location",
            "website",
            "followersCount",
            "followingCount",
            "postsCount",
            "engagement",
            "isVerified",
            "confirmed",
          ],
          populate: {
            profileImage: {
              fields: ["url", "formats"],
            },
            coverImage: {
              fields: ["url", "formats"],
            },
            posts: {
              sort: ["publishedAt:desc"],
              populate: {
                mediaItems: {
                  populate: {
                    file: {
                      fields: ["url", "formats"],
                    },
                  },
                  fields: ["id", "type", "order"],
                },
              },
              fields: [
                "id",
                "documentId",
                "description",
                "contentType",
                "galleryLayout",
                "publishedAt",
                "likesCount",
                "commentsCount",
              ],
            },
          },
        },
        {
          encodeValuesOnly: true,
        },
      )

      const apiUrl = getApiUrl()
      console.log(`Making request to: ${apiUrl}/api/users?${query}`)

      // Use cache: 'no-store' to ensure we get fresh data
      const response = await fetch(`${apiUrl}/api/users?${query}`, {
        method: "GET",
        headers,
        cache: "no-store",
      })

      console.log(`Response status for documentId ${documentId}: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}): ${errorText}`)
        throw new Error(`API error (${response.status}): ${errorText}`)
      }

      const responseData = await response.json()
      console.log("Response data structure:", Object.keys(responseData))

      // Handle Strapi v5 response structure
      let userData = null

      if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
        userData = responseData.data[0]
      } else if (responseData.results && Array.isArray(responseData.results) && responseData.results.length > 0) {
        userData = responseData.results[0]
      } else if (Array.isArray(responseData) && responseData.length > 0) {
        userData = responseData[0]
      }

      if (!userData) {
        console.log(`No user found with documentId: ${documentId}`)
        return null
      }

      // Process the data to ensure all URLs are absolute
      return UserService.processUserData(userData, apiUrl)
    } catch (error) {
      console.error(`Error fetching user by documentId ${documentId}:`, error)
      return null
    }
  }

  /**
   * Update a user's profile using /api/users/{userId} endpoint (Strapi v5)
   */
  static async updateProfile(
    token: string,
    userId: number,
    userData: UserUpdateInput,
  ): Promise<UserProfileResponse | null> {
    try {
      console.log(`Updating user profile for userId ${userId} with data:`, JSON.stringify(userData, null, 2))

      // Use /api/users/{userId} endpoint with numeric ID
      const apiUrl = getApiUrl()
      const url = `${apiUrl}/api/users/${userId}`
      console.log(`Making PUT request to: ${url}`)

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        cache: "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}): ${errorText}`)
        throw new Error(`API error (${response.status}): ${errorText}`)
      }

      const responseData = await response.json()
      console.log("Profile update response:", JSON.stringify(responseData, null, 2))

      // Handle Strapi v5 response structure
      const updatedUserData = responseData.data || responseData

      // Process the data to ensure all URLs are absolute
      return UserService.processUserData(updatedUserData, apiUrl)
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  /**
   * Upload a profile image using numeric userId (Strapi v5)
   */
  static async uploadProfileImage(token: string, userId: number, file: File): Promise<boolean> {
    try {
      console.log(`Uploading profile image for user ID ${userId}`)
      console.log("Using token:", token.substring(0, 10) + "...")

      const apiUrl = getApiUrl()
      const formData = new FormData()
      formData.append("files", file)

      // First, upload the file to get the file ID
      const uploadResponse = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        cache: "no-store",
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error(`API error (${uploadResponse.status}): ${errorText}`)
        throw new Error(`API error (${uploadResponse.status}): ${errorText}`)
      }

      const uploadData = await uploadResponse.json()
      console.log("File upload response:", JSON.stringify(uploadData, null, 2))

      if (!Array.isArray(uploadData) || uploadData.length === 0) {
        throw new Error("Failed to upload file: Invalid response")
      }

      const fileId = uploadData[0].id

      // Now update the user profile with the new profile image ID using numeric userId
      const updateResponse = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileImage: fileId,
        }),
        cache: "no-store",
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error(`API error (${updateResponse.status}): ${errorText}`)
        throw new Error(`API error (${updateResponse.status}): ${errorText}`)
      }

      return true
    } catch (error) {
      console.error("Error uploading profile image:", error)
      throw error
    }
  }

  /**
   * Upload a cover image using numeric userId (Strapi v5)
   */
  static async uploadCoverImage(token: string, userId: number, file: File): Promise<boolean> {
    try {
      console.log(`Uploading cover image for user ID ${userId}`)
      console.log("Using token:", token.substring(0, 10) + "...")

      const apiUrl = getApiUrl()
      const formData = new FormData()
      formData.append("files", file)

      // First, upload the file to get the file ID
      const uploadResponse = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        cache: "no-store",
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error(`API error (${uploadResponse.status}): ${errorText}`)
        throw new Error(`API error (${uploadResponse.status}): ${errorText}`)
      }

      const uploadData = await uploadResponse.json()
      console.log("File upload response:", JSON.stringify(uploadData, null, 2))

      if (!Array.isArray(uploadData) || uploadData.length === 0) {
        throw new Error("Failed to upload file: Invalid response")
      }

      const fileId = uploadData[0].id

      // Now update the user profile with the new cover image ID using numeric userId
      const updateResponse = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverImage: fileId,
        }),
        cache: "no-store",
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error(`API error (${updateResponse.status}): ${errorText}`)
        throw new Error(`API error (${updateResponse.status}): ${errorText}`)
      }

      return true
    } catch (error) {
      console.error("Error uploading cover image:", error)
      throw error
    }
  }

  /**
   * Process user data to ensure all URLs are absolute
   */
  static processUserData(userData: any, apiUrl: string): UserProfileResponse {
    if (!userData) return userData

    // Process profile image URL
    if (userData.profileImage && userData.profileImage.url) {
      userData.profileImage.url = UserService.ensureAbsoluteUrl(userData.profileImage.url, apiUrl)

      if (userData.profileImage.formats) {
        Object.keys(userData.profileImage.formats).forEach((format) => {
          if (userData.profileImage.formats[format]?.url) {
            userData.profileImage.formats[format].url = UserService.ensureAbsoluteUrl(
              userData.profileImage.formats[format].url,
              apiUrl,
            )
          }
        })
      }
    }

    // Process cover image URL
    if (userData.coverImage && userData.coverImage.url) {
      userData.coverImage.url = UserService.ensureAbsoluteUrl(userData.coverImage.url, apiUrl)

      if (userData.coverImage.formats) {
        Object.keys(userData.coverImage.formats).forEach((format) => {
          if (userData.coverImage.formats[format]?.url) {
            userData.coverImage.formats[format].url = UserService.ensureAbsoluteUrl(
              userData.coverImage.formats[format].url,
              apiUrl,
            )
          }
        })
      }
    }

    // Process posts and their media items
    if (userData.posts && Array.isArray(userData.posts)) {
      userData.posts = userData.posts.map((post) => {
        if (post.mediaItems && Array.isArray(post.mediaItems)) {
          post.mediaItems = post.mediaItems.map((item) => {
            if (item.file?.url) {
              item.file.url = UserService.ensureAbsoluteUrl(item.file.url, apiUrl)

              if (item.file.formats) {
                Object.keys(item.file.formats).forEach((format) => {
                  if (item.file.formats[format]?.url) {
                    item.file.formats[format].url = UserService.ensureAbsoluteUrl(item.file.formats[format].url, apiUrl)
                  }
                })
              }
            }
            return item
          })
        }
        return post
      })
    }

    return userData
  }

  /**
   * Ensure a URL is absolute
   */
  static ensureAbsoluteUrl(url: string, baseUrl: string): string {
    if (!url) return url
    if (url.startsWith("http://") || url.startsWith("https://")) return url
    if (url.startsWith("/")) {
      const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
      return `${cleanBaseUrl}${url}`
    }
    return `${baseUrl}/${url}`
  }

  /**
   * Get user engagement metrics - avoid client-side secrets
   */
  static async getUserEngagement(
    username: string,
    token?: string,
  ): Promise<{ likes: number; comments: number; saves: number } | null> {
    try {
      const apiUrl = getApiUrl()
      console.log(`Fetching engagement for ${username} from ${apiUrl}`)

      // If a token was provided, call Strapi directly
      if (token) {
        const response = await fetch(`${apiUrl}/api/users/engagement/${username}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })

        if (response.status === 404) {
          console.log(`No engagement data found for ${username}, using default values`)
          return { likes: 0, comments: 0, saves: 0 }
        }

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API error (${response.status}): ${errorText}`)
          throw new Error(`API error (${response.status}): ${errorText}`)
        }

        return await response.json()
      }

      // No token available on the client: use the server proxy to attach credentials securely
      const proxyResponse = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "GET",
          endpoint: `/api/users/engagement/${username}`,
        }),
        cache: "no-store",
      })

      if (proxyResponse.status === 404) {
        console.log(`No engagement data found for ${username}, using default values`)
        return { likes: 0, comments: 0, saves: 0 }
      }

      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text()
        console.error(`Proxy API error (${proxyResponse.status}): ${errorText}`)
        throw new Error(`API error (${proxyResponse.status}): ${errorText}`)
      }

      return await proxyResponse.json()
    } catch (error) {
      console.error(`Error fetching engagement for ${username}:`, error)
      return {
        likes: 0,
        comments: 0,
        saves: 0,
      }
    }
  }
}
