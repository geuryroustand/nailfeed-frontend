export type UserProfileResponse = {
  id: number
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
  return "https://nailfeed-backend-production.up.railway.app"
}

// Helper function to safely make API requests with proper error handling
async function safeApiRequest(url: string, options: RequestInit) {
  try {
    console.log(`Making API request to: ${url}`)
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

export const UserService = {
  /**
   * Get the current user's profile
   */
  async getCurrentUser(token: string): Promise<UserProfileResponse | null> {
    try {
      const apiUrl = getApiUrl()
      console.log(`Fetching user profile from: ${apiUrl}/api/users/me`)

      // Use populate=* to get all related data including images
      const response = await safeApiRequest(`${apiUrl}/api/users/me?populate=*`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { tags: ["user-profile"] },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching current user:", error)
      return null
    }
  },

  /**
   * Get a user's profile by username
   */
  async getUserByUsername(username: string, token?: string): Promise<UserProfileResponse | null> {
    try {
      const apiUrl = getApiUrl()

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await safeApiRequest(
        `${apiUrl}/api/users?filters[username][$eq]=${username}&populate[0]=profileImage&populate[1]=coverImage`,
        {
          method: "GET",
          headers,
          next: { tags: [`user-${username}`] },
        },
      )

      const data = await response.json()
      return data.results?.[0] || null
    } catch (error) {
      console.error(`Error fetching user ${username}:`, error)
      return null
    }
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(token: string, userData: UserUpdateInput): Promise<UserProfileResponse | null> {
    try {
      const apiUrl = getApiUrl()

      // First, get the current user to ensure we have the ID
      const currentUser = await this.getCurrentUser(token)
      if (!currentUser) {
        throw new Error("Failed to get current user")
      }

      console.log(`Updating user profile for ID: ${currentUser.id}`)

      // Use the standard users endpoint with the user ID
      const response = await safeApiRequest(`${apiUrl}/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      return await response.json()
    } catch (error) {
      console.error("Error updating profile:", error)
      return null
    }
  },

  /**
   * Upload a file to Strapi using direct API token
   */
  async uploadFile(token: string, file: File): Promise<any> {
    try {
      const apiUrl = getApiUrl()
      console.log(`Uploading file to: ${apiUrl}/api/upload`)

      // Create a new FormData instance
      const formData = new FormData()

      // Append the file with the key 'files'
      formData.append("files", file)

      console.log(`File details: name=${file.name}, size=${file.size}, type=${file.type}`)

      // Try with JWT token
      console.log("Attempting upload with JWT token")
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        // Add these options to help with fetch issues
        mode: "cors",
        credentials: "same-origin",
      })

      // Log the response status
      console.log(`Upload response status with JWT token: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error with JWT token (${response.status}): ${errorText}`)
        throw new Error(`Failed to upload file: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`Upload successful with JWT token, received data:`, data)
      return data
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  },

  /**
   * Update user profile with image IDs
   * This is a simplified approach that updates both profile info and image IDs in one request
   */
  async updateUserWithImages(
    token: string,
    userId: number,
    userData: UserUpdateInput,
    profileImageId?: number,
    coverImageId?: number,
  ): Promise<boolean> {
    try {
      const apiUrl = getApiUrl()
      console.log(`Updating user ${userId} with image IDs - Profile: ${profileImageId}, Cover: ${coverImageId}`)

      // Create the update payload
      const updateData = {
        ...userData,
      }

      // Add image IDs if provided
      if (profileImageId) {
        updateData.profileImage = profileImageId
      }

      if (coverImageId) {
        updateData.coverImage = coverImageId
      }

      console.log("Update payload:", JSON.stringify(updateData))

      // Make the request
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}): ${errorText}`)

        // Try with a different format for Strapi v4
        console.log("Trying with Strapi v4 format")

        const dataFormatV4 = {
          data: { ...updateData },
        }

        const responseV4 = await fetch(`${apiUrl}/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataFormatV4),
        })

        if (!responseV4.ok) {
          const errorTextV4 = await responseV4.text()
          console.error(`API error with v4 format (${responseV4.status}): ${errorTextV4}`)
          return false
        }
      }

      console.log("User updated successfully with images")
      return true
    } catch (error) {
      console.error("Error updating user with images:", error)
      return false
    }
  },

  /**
   * Upload a profile image and associate it with the user
   */
  async uploadProfileImage(token: string, userId: number, file: File): Promise<boolean> {
    try {
      console.log(`Starting profile image upload for user ${userId}`)

      // Step 1: Upload the file
      const uploadResponse = await this.uploadFile(token, file)

      // Check if we got a valid response with at least one file
      if (!uploadResponse || !Array.isArray(uploadResponse) || uploadResponse.length === 0) {
        console.error("Invalid upload response:", uploadResponse)
        throw new Error("Failed to upload image: Invalid response from server")
      }

      const fileId = uploadResponse[0].id
      console.log(`File uploaded successfully with ID: ${fileId}`)

      // Step 2: Update the user with the new profile image ID
      return await this.updateUserWithImages(token, userId, {}, fileId, undefined)
    } catch (error) {
      console.error("Error in uploadProfileImage:", error)
      return false
    }
  },

  /**
   * Upload a cover image and associate it with the user
   */
  async uploadCoverImage(token: string, userId: number, file: File): Promise<boolean> {
    try {
      console.log(`Starting cover image upload for user ${userId}`)

      // Step 1: Upload the file
      const uploadResponse = await this.uploadFile(token, file)

      // Check if we got a valid response with at least one file
      if (!uploadResponse || !Array.isArray(uploadResponse) || uploadResponse.length === 0) {
        console.error("Invalid upload response:", uploadResponse)
        throw new Error("Failed to upload image: Invalid response from server")
      }

      const fileId = uploadResponse[0].id
      console.log(`File uploaded successfully with ID: ${fileId}`)

      // Step 2: Update the user with the new cover image ID
      return await this.updateUserWithImages(token, userId, {}, undefined, fileId)
    } catch (error) {
      console.error("Error in uploadCoverImage:", error)
      return false
    }
  },

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(
    username: string,
    token?: string,
  ): Promise<{ likes: number; comments: number; saves: number } | null> {
    try {
      const apiUrl = getApiUrl()

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await safeApiRequest(`${apiUrl}/api/users/engagement/${username}`, {
        method: "GET",
        headers,
        next: { tags: [`user-engagement-${username}`] },
      })

      return await response.json()
    } catch (error) {
      console.error(`Error fetching engagement for ${username}:`, error)
      return null
    }
  },
}
